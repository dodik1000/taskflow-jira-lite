import { describe, expect, it } from 'vitest'
import { reorderTaskList } from './reorderTasks'

const tasks = [
  { id: 'task-1', column_id: 'col-1', title: 'Task 1', position: 0 },
  { id: 'task-2', column_id: 'col-1', title: 'Task 2', position: 1 },
  { id: 'task-3', column_id: 'col-1', title: 'Task 3', position: 2 },
  { id: 'task-4', column_id: 'col-2', title: 'Task 4', position: 0 },
]

describe('reorderTaskList', () => {
  it('reorders tasks inside the same column', () => {
    const result = reorderTaskList(tasks, 'task-1', 'task-3')

    expect(result).not.toBeNull()

    const col1Tasks = result!.tasks
      .filter((task) => task.column_id === 'col-1')
      .sort((a, b) => a.position - b.position)

    expect(col1Tasks.map((task) => task.id)).toEqual(['task-2', 'task-3', 'task-1'])

    expect(result!.updates).toEqual([
      { id: 'task-2', column_id: 'col-1', position: 0 },
      { id: 'task-3', column_id: 'col-1', position: 1 },
      { id: 'task-1', column_id: 'col-1', position: 2 },
    ])
  })

  it('moves task to another column before target task', () => {
    const result = reorderTaskList(tasks, 'task-1', 'task-4')

    expect(result).not.toBeNull()

    const col1Tasks = result!.tasks
      .filter((task) => task.column_id === 'col-1')
      .sort((a, b) => a.position - b.position)

    const col2Tasks = result!.tasks
      .filter((task) => task.column_id === 'col-2')
      .sort((a, b) => a.position - b.position)

    expect(col1Tasks.map((task) => task.id)).toEqual(['task-2', 'task-3'])
    expect(col2Tasks.map((task) => task.id)).toEqual(['task-1', 'task-4'])

    expect(result!.updates).toEqual([
      { id: 'task-2', column_id: 'col-1', position: 0 },
      { id: 'task-3', column_id: 'col-1', position: 1 },
      { id: 'task-1', column_id: 'col-2', position: 0 },
      { id: 'task-4', column_id: 'col-2', position: 1 },
    ])
  })

  it('moves task to empty column by column id', () => {
    const result = reorderTaskList(tasks, 'task-1', 'col-3')

    expect(result).not.toBeNull()

    const col3Tasks = result!.tasks
      .filter((task) => task.column_id === 'col-3')
      .sort((a, b) => a.position - b.position)

    expect(col3Tasks.map((task) => task.id)).toEqual(['task-1'])

    expect(result!.updates).toEqual([
      { id: 'task-2', column_id: 'col-1', position: 0 },
      { id: 'task-3', column_id: 'col-1', position: 1 },
      { id: 'task-1', column_id: 'col-3', position: 0 },
    ])
  })

  it('returns null when active task does not exist', () => {
    const result = reorderTaskList(tasks, 'unknown-task', 'task-2')

    expect(result).toBeNull()
  })
})
