import { supabase } from './supabase'

type CreateColumnData = {
  boardId: string
  title: string
  position: number
}

// get columns by board
export const getColumns = async (boardId: string) => {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position')

  if (error) throw error
  return data ?? []
}

// create default columns
export const createDefaultColumns = async (boardId: string) => {
  const payload = [
    { board_id: boardId, title: 'To Do', position: 0 },
    { board_id: boardId, title: 'In Progress', position: 1 },
    { board_id: boardId, title: 'Done', position: 2 },
  ]

  const { error } = await supabase.from('columns').insert(payload)

  if (error) throw error
}

// create column
export const createColumn = async ({ boardId, title, position }: CreateColumnData) => {
  const { data, error } = await supabase
    .from('columns')
    .insert([
      {
        board_id: boardId,
        title,
        position,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

// update column title
export const updateColumnTitle = async (columnId: string, title: string) => {
  const { error } = await supabase.from('columns').update({ title }).eq('id', columnId)

  if (error) throw error
}

// delete column
export const deleteColumn = async (columnId: string) => {
  const { error } = await supabase.from('columns').delete().eq('id', columnId)

  if (error) throw error
}

// update columns order
export const updateColumnsOrder = async (columns: Array<{ id: string; position: number }>) => {
  const updates = columns.map((column) =>
    supabase.from('columns').update({ position: column.position }).eq('id', column.id)
  )

  const results = await Promise.all(updates)

  const failed = results.find((res) => res.error)
  if (failed?.error) throw failed.error
}
