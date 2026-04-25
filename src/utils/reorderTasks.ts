import { arrayMove } from '@dnd-kit/sortable'

export type ReorderTask = {
  id: string
  column_id: string
  title: string
  position: number
}

export type ReorderResult = {
  tasks: ReorderTask[]
  updates: Array<{
    id: string
    column_id: string
    position: number
  }>
}

const groupTasksByColumn = (tasks: ReorderTask[]) => {
  return tasks.reduce<Record<string, ReorderTask[]>>((acc, task) => {
    if (!acc[task.column_id]) {
      acc[task.column_id] = []
    }

    acc[task.column_id].push(task)
    return acc
  }, {})
}

export const reorderTaskList = (
  tasks: ReorderTask[],
  activeTaskId: string,
  overId: string
): ReorderResult | null => {
  const tasksByColumn = groupTasksByColumn(tasks)

  Object.keys(tasksByColumn).forEach((columnId) => {
    tasksByColumn[columnId] = tasksByColumn[columnId].sort((a, b) => a.position - b.position)
  })

  const draggedTask = tasks.find((task) => task.id === activeTaskId)

  if (!draggedTask) return null

  const overTask = tasks.find((task) => task.id === overId)
  const sourceColumnId = draggedTask.column_id
  const targetColumnId = overTask ? overTask.column_id : overId

  if (sourceColumnId === targetColumnId) {
    const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])]
    const oldIndex = sourceTasks.findIndex((task) => task.id === activeTaskId)
    const newIndex = sourceTasks.findIndex((task) => task.id === overId)

    if (oldIndex === -1 || newIndex === -1) return null

    const reordered = arrayMove(sourceTasks, oldIndex, newIndex).map((task, index) => ({
      ...task,
      position: index,
    }))

    const nextTasks = tasks.map((task) => {
      const updated = reordered.find((item) => item.id === task.id)
      return updated ?? task
    })

    return {
      tasks: nextTasks,
      updates: reordered.map((task) => ({
        id: task.id,
        column_id: task.column_id,
        position: task.position,
      })),
    }
  }

  const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])]
  const targetTasks = [...(tasksByColumn[targetColumnId] ?? [])]

  const sourceIndex = sourceTasks.findIndex((task) => task.id === activeTaskId)

  if (sourceIndex === -1) return null

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
  const updates = [...updatedSource, ...updatedTarget].map((task) => ({
    id: task.id,
    column_id: task.column_id,
    position: task.position,
  }))

  return {
    tasks: nextTasks,
    updates,
  }
}
