import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BoardPage from './BoardPage'
import { useAuth } from '../../providers/auth-context'
import { getBoardById } from '../../services/boards'
import { getColumns } from '../../services/columns'
import { getBoardMembers, getUserBoardRole } from '../../services/members'
import { getTasksByColumnIds } from '../../services/tasks'

vi.mock('../../providers/auth-context', () => ({
  useAuth: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useParams: () => ({ id: 'board-1' }),
    useNavigate: () => vi.fn(),
  }
})

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
  closestCorners: vi.fn(),
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn(() => []),
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  verticalListSortingStrategy: vi.fn(),
}))

vi.mock('../../components/BoardColumn/BoardColumn', () => ({
  default: ({
    column,
    canManage,
    children,
  }: {
    column: { id: string; title: string }
    canManage: boolean
    children: React.ReactNode
  }) => (
    <div>
      <h3>{column.title}</h3>
      <span data-testid={`can-manage-${column.id}`}>{String(canManage)}</span>
      {children}
    </div>
  ),
}))

vi.mock('../../components/TaskCard/TaskCard', () => ({
  default: ({ task }: { task: { title: string } }) => <div>{task.title}</div>,
}))

vi.mock('../../components/TaskDetailsModal/TaskDetailsModal', () => ({
  default: () => null,
}))

vi.mock('../../services/boards', () => ({
  getBoardById: vi.fn(),
}))

vi.mock('../../services/columns', () => ({
  createColumn: vi.fn(),
  deleteColumn: vi.fn(),
  getColumns: vi.fn(),
  updateColumnsOrder: vi.fn(),
  updateColumnTitle: vi.fn(),
}))

vi.mock('../../services/members', () => ({
  addBoardMember: vi.fn(),
  findUserByEmail: vi.fn(),
  getBoardMembers: vi.fn(),
  getUserBoardRole: vi.fn(),
  removeBoardMember: vi.fn(),
}))

vi.mock('../../services/tasks', () => ({
  createTask: vi.fn(),
  deleteTask: vi.fn(),
  getTasksByColumnIds: vi.fn(),
  reorderTasks: vi.fn(),
}))

vi.mock('../../services/supabase', () => {
  const channelMock = {
    on: vi.fn(),
    subscribe: vi.fn(),
  }

  channelMock.on.mockReturnValue(channelMock)

  return {
    supabase: {
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
    },
  }
})

describe('BoardPage role UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-1' },
      session: null,
      loading: false,
    } as never)

    vi.mocked(getBoardById).mockResolvedValue({
      id: 'board-1',
      title: 'Project Board',
      owner_id: 'user-1',
      created_at: '2026-01-01',
    } as never)

    vi.mocked(getColumns).mockResolvedValue([
      {
        id: 'col-1',
        board_id: 'board-1',
        title: 'To Do',
        position: 0,
      },
    ] as never)

    vi.mocked(getTasksByColumnIds).mockResolvedValue([] as never)
    vi.mocked(getBoardMembers).mockResolvedValue([] as never)
  })

  it('shows board management controls for owner', async () => {
    vi.mocked(getUserBoardRole).mockResolvedValue({
      id: 'member-1',
      board_id: 'board-1',
      user_id: 'user-1',
      role: 'owner',
    } as never)

    render(
      <MemoryRouter>
        <BoardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Project Board')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('New column title')).toBeInTheDocument()
    expect(screen.getByText('Members')).toBeInTheDocument()
    expect(screen.getByTestId('can-manage-col-1')).toHaveTextContent('true')
  })

  it('hides board management controls for member', async () => {
    vi.mocked(getUserBoardRole).mockResolvedValue({
      id: 'member-1',
      board_id: 'board-1',
      user_id: 'user-1',
      role: 'member',
    } as never)

    render(
      <MemoryRouter>
        <BoardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Project Board')).toBeInTheDocument()
    })

    expect(screen.queryByPlaceholderText('New column title')).not.toBeInTheDocument()
    expect(screen.queryByText('Members')).not.toBeInTheDocument()
    expect(screen.getByTestId('can-manage-col-1')).toHaveTextContent('false')
  })
})
