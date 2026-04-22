import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../providers/auth-context'
import { createBoard, deleteBoard, getBoards } from '../../services/boards'
import { createDefaultColumns } from '../../services/columns'
import { supabase } from '../../services/supabase'
import './index.scss'

type Board = {
  id: string
  title: string
  owner_id: string
  created_at: string
}

type ToastState = {
  message: string
  type: 'success' | 'error'
}

// boards page
export default function BoardsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [boards, setBoards] = useState<Board[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
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

  // load boards
  const loadBoards = useCallback(async () => {
    try {
      if (!user) return

      setLoading(true)

      const data = await getBoards()
      setBoards(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load boards'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!user) return
    void loadBoards()
  }, [user, loadBoards])
  /* eslint-enable react-hooks/set-state-in-effect */

  // create board
  const handleCreate = async () => {
    try {
      const value = title.trim()

      if (!value || !user) return

      setActionLoading(true)

      const newBoard = await createBoard(value, user.id)

      // create default columns
      await createDefaultColumns(newBoard.id)

      setTitle('')
      await loadBoards()

      setToast({
        message: 'Board created',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create board'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // delete board
  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true)
      await deleteBoard(id)
      await loadBoards()

      setToast({
        message: 'Board deleted',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete board'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  // logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className='boards-page'>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className='boards-page__header'>
        <h1 className='boards-page__title'>Boards</h1>

        <button type='button' className='boards-page__logout' onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className='boards-page__create'>
        <input
          className='boards-page__input'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Board title'
          disabled={actionLoading}
        />

        <button
          type='button'
          className='boards-page__create-button'
          onClick={handleCreate}
          disabled={actionLoading}
        >
          {actionLoading ? 'Please wait...' : 'Create'}
        </button>
      </div>

      {loading ? (
        <Loader text='Loading boards...' />
      ) : (
        <div className='boards-page__list'>
          {boards.map((board) => (
            <div key={board.id} className='boards-page__card'>
              <button
                type='button'
                className='boards-page__board-link'
                onClick={() => navigate(`/board/${board.id}`)}
              >
                {board.title}
              </button>

              {board.owner_id === user?.id && (
                <button
                  type='button'
                  className='boards-page__delete'
                  onClick={() => handleDelete(board.id)}
                  disabled={actionLoading}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
