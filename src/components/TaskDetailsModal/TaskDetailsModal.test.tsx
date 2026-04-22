import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TaskDetailsModal from './TaskDetailsModal'

vi.mock('../Modal/Modal', () => ({
  default: ({
    children,
    isOpen,
    title,
  }: {
    children: React.ReactNode
    isOpen: boolean
    title: string
  }) =>
    isOpen ? (
      <div>
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}))

vi.mock('../../services/comments', () => ({
  getComments: vi.fn().mockResolvedValue([]),
  createComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../services/tasks', () => ({
  updateTask: vi.fn().mockResolvedValue({}),
}))

describe('TaskDetailsModal', () => {
  const baseProps = {
    isOpen: true,
    task: {
      id: 'task-1',
      title: 'My task',
      description: 'Task description',
      priority: 'medium' as const,
      due_date: '2026-05-01',
      assignee_id: '',
    },
    members: [],
    currentUserId: 'user-1',
    onClose: vi.fn(),
    onTaskUpdated: vi.fn().mockResolvedValue(undefined),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders task fields', async () => {
    render(<TaskDetailsModal {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('My task')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('Task description')).toBeInTheDocument()
  })

  it('allows typing comment', async () => {
    const user = userEvent.setup()

    render(<TaskDetailsModal {...baseProps} />)

    const textarea = await screen.findByPlaceholderText('Write a comment')
    await user.type(textarea, 'New comment')

    expect(screen.getByDisplayValue('New comment')).toBeInTheDocument()
  })
})
