import type { ReactNode } from 'react'
import { useDroppable } from '@dnd-kit/core'
import './index.scss'

type BoardColumnProps = {
  column: {
    id: string
    title: string
  }
  canManage: boolean
  children: ReactNode
  onDelete: (columnId: string) => void
  onRename: (columnId: string, currentTitle: string) => void
  onMoveLeft: (columnId: string) => void
  onMoveRight: (columnId: string) => void
}

// drop area for tasks
export default function BoardColumn({
  column,
  children,
  onDelete,
  onRename,
  onMoveLeft,
  onMoveRight,
  canManage,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div ref={setNodeRef} className={`board-column ${isOver ? 'board-column--active' : ''}`}>
      <div className='board-column__header'>
        <h3 className='board-column__title'>{column.title}</h3>
      </div>
      <div className='board-column__content'>{children}</div>

      {canManage && (
        <div className='board-column__actions'>
          <button
            type='button'
            className='board-column__action'
            onClick={() => onMoveLeft(column.id)}
          >
            ←
          </button>

          <button
            type='button'
            className='board-column__action'
            onClick={() => onMoveRight(column.id)}
          >
            →
          </button>

          <button
            type='button'
            className='board-column__action'
            onClick={() => onRename(column.id, column.title)}
          >
            Edit
          </button>

          <button
            type='button'
            className='board-column__action board-column__action--danger'
            onClick={() => onDelete(column.id)}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
