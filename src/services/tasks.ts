import { supabase } from './supabase'

type TaskUpdates = {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string | null
  assignee_id?: string | null
  column_id?: string
  position?: number
}

// get tasks by one column
export const getTasks = async (columnId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('column_id', columnId)
    .order('position')

  if (error) throw error
  return data ?? []
}

// get tasks by many columns
export const getTasksByColumnIds = async (columnIds: string[]) => {
  if (columnIds.length === 0) return []

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .in('column_id', columnIds)
    .order('column_id')
    .order('position')

  if (error) throw error
  return data ?? []
}

// create task
export const createTask = async (columnId: string, title: string) => {
  const { data: existingTasks, error: loadError } = await supabase
    .from('tasks')
    .select('id')
    .eq('column_id', columnId)

  if (loadError) throw loadError

  const nextPosition = existingTasks?.length ?? 0

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        column_id: columnId,
        title,
        priority: 'medium',
        position: nextPosition,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

// update task
export const updateTask = async (taskId: string, updates: TaskUpdates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

// bulk reorder tasks
export const reorderTasks = async (
  taskUpdates: Array<{
    id: string
    column_id: string
    position: number
  }>
) => {
  const requests = taskUpdates.map((task) =>
    supabase
      .from('tasks')
      .update({
        column_id: task.column_id,
        position: task.position,
      })
      .eq('id', task.id)
  )

  const results = await Promise.all(requests)

  const failed = results.find((result) => result.error)

  if (failed?.error) throw failed.error
}

// delete task
export const deleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) throw error
}

// get single task
export const getTaskById = async (taskId: string) => {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', taskId).single()

  if (error) throw error
  return data
}
