import { useEffect, useState } from 'react'
import Modal from '../Modal/Modal'
import Toast from '../Toast/Toast'
import { createComment, deleteComment, getComments } from '../../services/comments'
import { updateTask } from '../../services/tasks'
import './index.scss'

type MemberProfile = {
  id: string
  name: string | null
  email?: string | null
  avatar_url: string | null
}

type Member = {
  id: string
  board_id: string
  user_id: string
  role: 'owner' | 'member'
  profiles: MemberProfile | null
}

type TaskDetailsTask = {
  id: string
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  assignee_id?: string | null
}

type CommentProfile = {
  id: string
  name: string | null
  email?: string | null
  avatar_url: string | null
}

type CommentItem = {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  profiles: CommentProfile | null
}

type TaskDetailsModalProps = {
  isOpen: boolean
  task: TaskDetailsTask | null
  members: Member[]
  currentUserId: string
  onClose: () => void
  onTaskUpdated: () => Promise<void>
}

type ToastState = {
  message: string
  type: 'success' | 'error'
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
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
  })

  useEffect(() => {
    if (!toast.message) return

    const timer = setTimeout(() => {
      setToast({ message: '', type: 'success' })
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!task) return

    setTitle(task.title ?? '')
    setDescription(task.description ?? '')
    setPriority(task.priority ?? 'medium')
    setDueDate(task.due_date ?? '')
    setAssigneeId(task.assignee_id ?? '')
  }, [task])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!task || !isOpen) return

    const loadComments = async () => {
      try {
        const data = await getComments(task.id)
        setComments(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load comments'

        setToast({
          message,
          type: 'error',
        })
      }
    }

    void loadComments()
  }, [task, isOpen])

  const handleSave = async () => {
    if (!task) return

    try {
      setLoading(true)

      await updateTask(task.id, {
        title,
        description,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId || null,
      })

      await onTaskUpdated()

      setToast({
        message: 'Task updated',
        type: 'success',
      })

      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!task || !commentText.trim()) return

    try {
      setLoading(true)

      await createComment(task.id, currentUserId, commentText.trim())

      const data = await getComments(task.id)
      setComments(data)
      setCommentText('')

      setToast({
        message: 'Comment added',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      setLoading(true)

      await deleteComment(commentId)

      if (task) {
        const data = await getComments(task.id)
        setComments(data)
      }

      setToast({
        message: 'Comment deleted',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title='Task details' isOpen={isOpen} onClose={onClose}>
      <>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        <div className='task-details'>
          <input
            className='task-details__input'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Task title'
            disabled={loading}
          />

          <textarea
            className='task-details__textarea'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Description'
            disabled={loading}
          />

          <select
            className='task-details__input'
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            disabled={loading}
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
            disabled={loading}
          />

          <select
            className='task-details__input'
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={loading}
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
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type='button'
              className='task-details__button'
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Save'}
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
                disabled={loading}
              />

              <button
                type='button'
                className='task-details__button'
                onClick={handleAddComment}
                disabled={loading}
              >
                {loading ? 'Please wait...' : 'Add comment'}
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
                        disabled={loading}
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
      </>
    </Modal>
  )
}
