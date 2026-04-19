import { useEffect, useState } from 'react'
import Modal from '../Modal/Modal'
import { createComment, deleteComment, getComments } from '../../services/comments'
import { updateTask } from '../../services/tasks'
import './index.scss'

type TaskDetailsModalProps = {
  isOpen: boolean
  task: any
  members: any[]
  currentUserId: string
  onClose: () => void
  onTaskUpdated: () => Promise<void>
}

export default function TaskDetailsModal({
  isOpen,
  task,
  members,
  currentUserId,
  onClose,
  onTaskUpdated,
}: TaskDetailsModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [comments, setComments] = useState<any[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!task) return

    setTitle(task.title ?? '')
    setDescription(task.description ?? '')
    setPriority(task.priority ?? 'medium')
    setDueDate(task.due_date ?? '')
    setAssigneeId(task.assignee_id ?? '')
  }, [task])

  useEffect(() => {
    if (!task || !isOpen) return

    const loadComments = async () => {
      const data = await getComments(task.id)
      setComments(data)
    }

    loadComments()
  }, [task, isOpen])

  const handleSave = async () => {
    if (!task) return

    setLoading(true)

    await updateTask(task.id, {
      title,
      description,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
    })

    await onTaskUpdated()
    setLoading(false)
    onClose()
  }

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return

    setLoading(true)

    await createComment(task.id, currentUserId, commentText.trim())
    const data = await getComments(task.id)
    setComments(data)
    setCommentText('')

    setLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    setLoading(true)
    await deleteComment(commentId)

    if (task) {
      const data = await getComments(task.id)
      setComments(data)
    }

    setLoading(false)
  }

  return (
    <Modal title='Task details' isOpen={isOpen} onClose={onClose}>
      <div className='task-details'>
        <input
          className='task-details__input'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Task title'
        />

        <textarea
          className='task-details__textarea'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Description'
        />

        <select
          className='task-details__input'
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
        >
          <option value='low'>Low</option>
          <option value='medium'>Medium</option>
          <option value='high'>High</option>
        </select>

        <input
          className='task-details__input'
          type='date'
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <select
          className='task-details__input'
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value=''>No assignee</option>
          {members.map((member) => {
            const profile = member.profiles
            const displayName = profile?.name || 'Unknown user'
            const displayEmail = profile?.email || member.user_id

            return (
              <option key={member.user_id} value={member.user_id}>
                {displayName} ({displayEmail})
              </option>
            )
          })}
        </select>

        <div className='task-details__actions'>
          <button
            type='button'
            className='task-details__button task-details__button--secondary'
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type='button'
            className='task-details__button'
            onClick={handleSave}
            disabled={loading}
          >
            Save
          </button>
        </div>

        <div className='task-details__comments'>
          <h4 className='task-details__comments-title'>Comments</h4>

          <div className='task-details__comment-create'>
            <textarea
              className='task-details__textarea'
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder='Write a comment'
            />

            <button
              type='button'
              className='task-details__button'
              onClick={handleAddComment}
              disabled={loading}
            >
              Add comment
            </button>
          </div>

          <div className='task-details__comment-list'>
            {comments.map((comment) => {
              const profile = comment.profiles
              const displayName = profile?.name || 'Unknown user'
              const displayEmail = profile?.email || comment.user_id

              return (
                <div key={comment.id} className='task-details__comment'>
                  <div className='task-details__comment-meta'>
                    <div className='task-details__comment-author'>
                      <span className='task-details__comment-name'>{displayName}</span>
                      <span className='task-details__comment-email'>{displayEmail}</span>
                    </div>

                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>

                  <p className='task-details__comment-text'>{comment.content}</p>

                  {comment.user_id === currentUserId && (
                    <button
                      type='button'
                      className='task-details__comment-delete'
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
