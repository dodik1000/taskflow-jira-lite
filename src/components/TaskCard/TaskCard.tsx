import type { MouseEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import './index.scss'

type TaskCardTask = {
  id: string
  column_id: string
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  assignee_id?: string | null
  position: number
}

type TaskCardProps = {
  task: TaskCardTask
  onDelete?: (taskId: string) => void
  onOpen?: (task: TaskCardTask) => void
  isOverlay?: boolean
}

export default function TaskCard({ task, onDelete, onOpen, isOverlay = false }: TaskCardProps) {
  const draggable = useDraggable({
    id: task.id,
    disabled: isOverlay,
  })

  const { attributes, listeners, setNodeRef, transform, isDragging } = draggable

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined

  const handleDeleteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    onDelete?.(task.id)
  }

  if (isOverlay) {
    return (
      <div className='task-card task-card--overlay'>
        <span className='task-card__title'>{task.title}</span>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`task-card ${isDragging ? 'task-card--dragging' : ''}`}
      style={{ transform: transformStyle }}
      onClick={() => onOpen?.(task)}
      {...listeners}
      {...attributes}
    >
      <span className='task-card__title'>{task.title}</span>

      <button type='button' className='task-card__delete' onClick={handleDeleteClick}>
        ×
      </button>
    </div>
  )
}
