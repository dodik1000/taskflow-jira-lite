import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import TaskCard from './TaskCard'

vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <TaskCard
        task={{
          id: '1',
          column_id: 'col-1',
          title: 'Test task',
          position: 0,
        }}
      />
    )

    expect(screen.getByText('Test task')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()

    render(
      <TaskCard
        task={{
          id: '1',
          column_id: 'col-1',
          title: 'Test task',
          position: 0,
        }}
        onDelete={onDelete}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(onDelete).toHaveBeenCalledWith('1')
  })
})
