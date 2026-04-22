import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useNavigate, useParams } from 'react-router-dom'
import BoardColumn from '../../components/BoardColumn/BoardColumn'
import Loader from '../../components/Loader/Loader'
import Modal from '../../components/Modal/Modal'
import TaskCard from '../../components/TaskCard/TaskCard'
import TaskDetailsModal from '../../components/TaskDetailsModal/TaskDetailsModal'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../providers/auth-context'
import {
  createColumn,
  deleteColumn,
  getColumns,
  updateColumnsOrder,
  updateColumnTitle,
} from '../../services/columns'
import { getBoardById } from '../../services/boards'
import {
  addBoardMember,
  findUserByEmail,
  getBoardMembers,
  getUserBoardRole,
  removeBoardMember,
} from '../../services/members'
import { createTask, deleteTask, getTasks, reorderTasks } from '../../services/tasks'
import { supabase } from '../../services/supabase'
import './index.scss'

type Column = {
  id: string
  board_id: string
  title: string
  position: number
}

type Task = {
  id: string
  column_id: string
  title: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  assignee_id?: string | null
  position: number
}

type ToastState = {
  message: string
  type: 'success' | 'error'
}

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

export default function BoardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [newTaskByColumn, setNewTaskByColumn] = useState<Record<string, string>>({})
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<'owner' | 'member' | ''>('')
  const [boardTitle, setBoardTitle] = useState('')

  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
  })

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [memberEmail, setMemberEmail] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  )

  useEffect(() => {
    if (!toast.message) return

    const timer = setTimeout(() => {
      setToast({ message: '', type: 'success' })
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast])

  const loadColumns = useCallback(async () => {
    if (!id) return []

    const data = await getColumns(id)
    setColumns(data)
    return data
  }, [id])

  const loadTasks = useCallback(async (cols: Column[]) => {
    let allTasks: Task[] = []

    for (const col of cols) {
      const colTasks = await getTasks(col.id)
      allTasks = [...allTasks, ...colTasks]
    }

    setTasks(allTasks)
  }, [])

  const loadMembers = useCallback(async () => {
    if (!id) return []

    const data = await getBoardMembers(id)
    setMembers(data)
    return data
  }, [id])

  const loadCurrentRole = useCallback(async () => {
    if (!id || !user?.id) return

    const data = await getUserBoardRole(id, user.id)

    if (data) {
      setCurrentRole(data.role)
    } else {
      setCurrentRole('')
    }
  }, [id, user])

  const checkBoardAccess = useCallback(async () => {
    if (!id || !user?.id) return false

    const roleData = await getUserBoardRole(id, user.id)
    return !!roleData
  }, [id, user])

  const loadBoardData = useCallback(async () => {
    try {
      setLoading(true)

      const access = await checkBoardAccess()

      if (!access) {
        setCurrentRole('')
        setColumns([])
        setTasks([])
        setMembers([])
        setBoardTitle('')
        return
      }

      if (!id) return

      const board = await getBoardById(id)
      setBoardTitle(board.title)

      const cols = await loadColumns()
      await loadTasks(cols)
      await loadMembers()
      await loadCurrentRole()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load board data'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [checkBoardAccess, id, loadColumns, loadCurrentRole, loadMembers, loadTasks])

  useEffect(() => {
    if (!id) return

    const init = async () => {
      await loadBoardData()
    }

    void init()
  }, [id, loadBoardData])

  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`board-${id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        async () => {
          const cols = await loadColumns()
          await loadTasks(cols)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
        },
        async () => {
          await loadBoardData()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [id, loadBoardData, loadColumns, loadTasks])

  const tasksByColumn = useMemo(() => {
    return columns.reduce<Record<string, Task[]>>((acc, column) => {
      acc[column.id] = tasks
        .filter((task) => task.column_id === column.id)
        .sort((a, b) => a.position - b.position)

      return acc
    }, {})
  }, [columns, tasks])

  const handleTaskInputChange = (columnId: string, value: string) => {
    setNewTaskByColumn((prev) => ({
      ...prev,
      [columnId]: value,
    }))
  }

  const handleAddMember = async () => {
    try {
      if (!id) return

      const email = memberEmail.trim().toLowerCase()

      if (!email) return

      setActionLoading(true)

      const profile = await findUserByEmail(email)

      if (!profile) {
        setToast({
          message: 'User with this email was not found',
          type: 'error',
        })
        return
      }

      const alreadyExists = members.some((member) => member.user_id === profile.id)

      if (alreadyExists) {
        setToast({
          message: 'User is already a member',
          type: 'error',
        })
        return
      }

      await addBoardMember(id, profile.id, 'member')
      setMemberEmail('')
      await loadMembers()

      setToast({
        message: 'Member added',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add member'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      if (!id) return

      if (userId === user?.id) {
        setToast({
          message: 'Owner cannot remove themselves',
          type: 'error',
        })
        return
      }

      setActionLoading(true)

      await removeBoardMember(id, userId)
      await loadMembers()

      setToast({
        message: 'Member removed',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateTask = async (columnId: string) => {
    try {
      const value = newTaskByColumn[columnId]?.trim()

      if (!value) return

      setActionLoading(true)

      await createTask(columnId, value)

      setNewTaskByColumn((prev) => ({
        ...prev,
        [columnId]: '',
      }))

      await loadTasks(columns)

      setToast({
        message: 'Task created',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setActionLoading(true)
      await deleteTask(taskId)
      await loadTasks(columns)

      setToast({
        message: 'Task deleted',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task)
    setTaskModalOpen(true)
  }

  const handleCreateColumn = async () => {
    try {
      if (!id) return

      const value = newColumnTitle.trim()

      if (!value) return

      setActionLoading(true)

      await createColumn({
        boardId: id,
        title: value,
        position: columns.length,
      })

      setNewColumnTitle('')
      await loadBoardData()

      setToast({
        message: 'Column created',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create column'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenameColumn = (columnId: string, currentTitle: string) => {
    setSelectedColumnId(columnId)
    setRenameValue(currentTitle)
    setRenameModalOpen(true)
  }

  const handleRenameSubmit = async () => {
    try {
      const value = renameValue.trim()

      if (!value || !selectedColumnId) return

      setActionLoading(true)

      await updateColumnTitle(selectedColumnId, value)
      await loadBoardData()

      setRenameModalOpen(false)
      setSelectedColumnId('')
      setRenameValue('')

      setToast({
        message: 'Column renamed',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename column'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteColumn = (columnId: string) => {
    setSelectedColumnId(columnId)
    setDeleteModalOpen(true)
  }

  const handleDeleteColumnConfirm = async () => {
    try {
      if (!selectedColumnId) return

      setActionLoading(true)

      await deleteColumn(selectedColumnId)
      await loadBoardData()

      setDeleteModalOpen(false)
      setSelectedColumnId('')

      setToast({
        message: 'Column deleted',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete column'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const moveColumn = async (columnId: string, direction: 'left' | 'right') => {
    try {
      const currentIndex = columns.findIndex((column) => column.id === columnId)

      if (currentIndex === -1) return

      const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1

      if (targetIndex < 0 || targetIndex >= columns.length) return

      const updatedColumns = [...columns]
      const temp = updatedColumns[currentIndex]

      updatedColumns[currentIndex] = updatedColumns[targetIndex]
      updatedColumns[targetIndex] = temp

      const columnsWithPosition = updatedColumns.map((column, index) => ({
        id: column.id,
        position: index,
      }))

      setActionLoading(true)

      await updateColumnsOrder(columnsWithPosition)
      await loadBoardData()

      setToast({
        message: 'Column order updated',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update column order'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleMoveColumnLeft = async (columnId: string) => {
    await moveColumn(columnId, 'left')
  }

  const handleMoveColumnRight = async (columnId: string) => {
    await moveColumn(columnId, 'right')
  }

  const handleBack = () => {
    navigate('/')
  }

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id)
    const currentTask = tasks.find((task) => task.id === taskId) ?? null
    setActiveTask(currentTask)
  }

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    try {
      const { active, over } = event

      setActiveTask(null)

      if (!over) return
      if (active.id === over.id) return

      const activeTaskId = String(active.id)
      const overId = String(over.id)

      const draggedTask = tasks.find((task) => task.id === activeTaskId)
      if (!draggedTask) return

      const overTask = tasks.find((task) => task.id === overId)
      const targetColumnId = overTask ? overTask.column_id : overId

      const sourceColumnId = draggedTask.column_id

      if (sourceColumnId === targetColumnId) {
        const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])]
        const oldIndex = sourceTasks.findIndex((task) => task.id === activeTaskId)
        const newIndex = sourceTasks.findIndex((task) => task.id === overId)

        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(sourceTasks, oldIndex, newIndex).map((task, index) => ({
          ...task,
          position: index,
        }))

        const nextTasks = tasks.map((task) => {
          const updated = reordered.find((item) => item.id === task.id)
          return updated ?? task
        })

        setTasks(nextTasks)
        setActionLoading(true)

        await reorderTasks(
          reordered.map((task) => ({
            id: task.id,
            column_id: task.column_id,
            position: task.position,
          }))
        )
      } else {
        const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])]
        const targetTasks = [...(tasksByColumn[targetColumnId] ?? [])]

        const sourceIndex = sourceTasks.findIndex((task) => task.id === activeTaskId)
        if (sourceIndex === -1) return

        const [movedTask] = sourceTasks.splice(sourceIndex, 1)

        const overIndex = targetTasks.findIndex((task) => task.id === overId)
        const insertIndex = overTask ? overIndex : targetTasks.length

        targetTasks.splice(insertIndex, 0, {
          ...movedTask,
          column_id: targetColumnId,
        })

        const updatedSource = sourceTasks.map((task, index) => ({
          ...task,
          position: index,
        }))

        const updatedTarget = targetTasks.map((task, index) => ({
          ...task,
          position: index,
        }))

        const untouchedTasks = tasks.filter(
          (task) => task.column_id !== sourceColumnId && task.column_id !== targetColumnId
        )

        const nextTasks = [...untouchedTasks, ...updatedSource, ...updatedTarget]

        setTasks(nextTasks)
        setActionLoading(true)

        await reorderTasks(
          [...updatedSource, ...updatedTarget].map((task) => ({
            id: task.id,
            column_id: task.column_id,
            position: task.position,
          }))
        )
      }

      setToast({
        message: 'Task order updated',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reorder task'

      setToast({
        message,
        type: 'error',
      })

      await loadTasks(columns)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className='board-page'>
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />

        <div className='board-page__header'>
          <button type='button' className='board-page__back' onClick={handleBack}>
            ← Back to boards
          </button>

          <h1 className='board-page__title'>{boardTitle || 'Board'}</h1>
        </div>

        {currentRole === 'owner' && (
          <div className='board-page__add-column'>
            <input
              className='board-page__input'
              type='text'
              placeholder='New column title'
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              disabled={actionLoading}
            />

            <button
              type='button'
              className='board-page__button'
              onClick={handleCreateColumn}
              disabled={actionLoading}
            >
              {actionLoading ? 'Please wait...' : 'Add column'}
            </button>
          </div>
        )}

        {currentRole === 'owner' && (
          <div className='board-page__members'>
            <h3 className='board-page__section-title'>Members</h3>

            <div className='board-page__members-add'>
              <input
                className='board-page__input'
                type='email'
                placeholder='Member email'
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                disabled={actionLoading}
              />

              <button
                type='button'
                className='board-page__button'
                onClick={handleAddMember}
                disabled={actionLoading}
              >
                Add member
              </button>
            </div>

            <div className='board-page__members-list'>
              {members.map((member) => {
                const profile = member.profiles
                const displayName = profile?.name || 'Unknown user'
                const displayEmail = profile?.email || member.user_id

                return (
                  <div key={member.id} className='board-page__member-card'>
                    <div className='board-page__member-info'>
                      <span className='board-page__member-name'>{displayName}</span>
                      <span className='board-page__member-email'>{displayEmail}</span>
                      <span className='board-page__member-role'>{member.role}</span>
                    </div>

                    {member.role !== 'owner' && (
                      <button
                        type='button'
                        className='board-page__button board-page__button--danger'
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={actionLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {loading ? (
          <Loader text='Loading board...' />
        ) : (
          <div className='board-page__columns'>
            {columns.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                onDelete={handleDeleteColumn}
                onRename={handleRenameColumn}
                onMoveLeft={handleMoveColumnLeft}
                onMoveRight={handleMoveColumnRight}
                canManage={currentRole === 'owner'}
              >
                <SortableContext
                  items={(tasksByColumn[col.id] ?? []).map((task) => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(tasksByColumn[col.id] ?? []).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDelete={handleDeleteTask}
                      onOpen={handleOpenTask}
                    />
                  ))}
                </SortableContext>

                <div className='board-page__create-task'>
                  <input
                    className='board-page__input'
                    type='text'
                    placeholder='New task'
                    value={newTaskByColumn[col.id] ?? ''}
                    onChange={(e) => handleTaskInputChange(col.id, e.target.value)}
                    disabled={actionLoading}
                  />

                  <button
                    type='button'
                    className='board-page__button'
                    onClick={() => handleCreateTask(col.id)}
                    disabled={actionLoading}
                  >
                    Add
                  </button>
                </div>
              </BoardColumn>
            ))}
          </div>
        )}

        <Modal
          title='Rename column'
          isOpen={renameModalOpen}
          onClose={() => {
            if (actionLoading) return
            setRenameModalOpen(false)
            setSelectedColumnId('')
            setRenameValue('')
          }}
        >
          <div className='board-page__modal-body'>
            <input
              className='board-page__input'
              type='text'
              placeholder='Column title'
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              disabled={actionLoading}
            />

            <div className='board-page__modal-actions'>
              <button
                type='button'
                className='board-page__button board-page__button--secondary'
                onClick={() => {
                  setRenameModalOpen(false)
                  setSelectedColumnId('')
                  setRenameValue('')
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type='button'
                className='board-page__button'
                onClick={handleRenameSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>

        <Modal
          title='Delete column'
          isOpen={deleteModalOpen}
          onClose={() => {
            if (actionLoading) return
            setDeleteModalOpen(false)
            setSelectedColumnId('')
          }}
        >
          <div className='board-page__modal-body'>
            <p className='board-page__modal-text'>
              Are you sure you want to delete this column? All tasks inside this column will also be
              deleted.
            </p>

            <div className='board-page__modal-actions'>
              <button
                type='button'
                className='board-page__button board-page__button--secondary'
                onClick={() => {
                  setDeleteModalOpen(false)
                  setSelectedColumnId('')
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type='button'
                className='board-page__button board-page__button--danger'
                onClick={handleDeleteColumnConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Please wait...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>

        <TaskDetailsModal
          isOpen={taskModalOpen}
          task={selectedTask}
          members={members}
          currentUserId={user?.id ?? ''}
          onClose={() => {
            setTaskModalOpen(false)
            setSelectedTask(null)
          }}
          onTaskUpdated={loadBoardData}
        />

        <DragOverlay>{activeTask ? <TaskCard task={activeTask} isOverlay /> : null}</DragOverlay>
      </div>
    </DndContext>
  )
}
