import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import BoardColumn from './BoardColumn'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}))

describe('BoardColumn', () => {
  it('renders title and children', () => {
    render(
      <BoardColumn
        column={{ id: '1', title: 'To Do' }}
        onDelete={vi.fn()}
        onRename={vi.fn()}
        onMoveLeft={vi.fn()}
        onMoveRight={vi.fn()}
        canManage={true}
      >
        <div>Task content</div>
      </BoardColumn>
    )

    expect(screen.getByText('To Do')).toBeInTheDocument()
    expect(screen.getByText('Task content')).toBeInTheDocument()
  })
})
