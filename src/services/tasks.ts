import { supabase } from './supabase'

// get tasks by column
export const getTasks = async (columnId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('column_id', columnId)
    .order('position')

  if (error) throw error
  return data
}

// create task
export const createTask = async (columnId: string, title: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        column_id: columnId,
        title,
        priority: 'medium',
      },
    ])
    .select()

  if (error) throw error
  return data[0]
}

// update task
export const updateTask = async (
  taskId: string,
  updates: {
    title?: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    due_date?: string | null
    assignee_id?: string | null
    column_id?: string
  }
) => {
  const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select()

  if (error) throw error
  return data[0]
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
