import type { CSSProperties, MouseEvent } from 'react'
import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
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
  const sortable = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
      columnId: task.column_id,
    },
    disabled: isOverlay,
  })

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

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
      style={style}
      onClick={() => onOpen?.(task)}
      {...attributes}
      {...listeners}
    >
      <span className='task-card__title'>{task.title}</span>

      <button type='button' className='task-card__delete' onClick={handleDeleteClick}>
        ×
      </button>
    </div>
  )
}
