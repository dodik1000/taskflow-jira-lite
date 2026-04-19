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

  if (error) {
    console.error('getColumns error:', error)
    throw error
  }

  return data
}

// create default columns
export const createDefaultColumns = async (boardId: string) => {
  const payload = [
    { board_id: boardId, title: 'To Do', position: 0 },
    { board_id: boardId, title: 'In Progress', position: 1 },
    { board_id: boardId, title: 'Done', position: 2 },
  ]

  console.log('createDefaultColumns payload:', payload)

  const { error } = await supabase.from('columns').insert(payload)

  if (error) {
    console.error('createDefaultColumns error:', error)
    throw error
  }
}

// create column
export const createColumn = async ({ boardId, title, position }: CreateColumnData) => {
  const payload = {
    board_id: boardId,
    title,
    position,
  }

  console.log('createColumn payload:', payload)

  const { data, error } = await supabase.from('columns').insert([payload]).select()

  console.log('createColumn result:', { data, error })

  if (error) {
    console.error('createColumn error:', error)
    throw error
  }

  return data[0]
}

// update column title
export const updateColumnTitle = async (columnId: string, title: string) => {
  const { error } = await supabase.from('columns').update({ title }).eq('id', columnId)

  if (error) {
    console.error('updateColumnTitle error:', error)
    throw error
  }
}

// delete column
export const deleteColumn = async (columnId: string) => {
  const { error } = await supabase.from('columns').delete().eq('id', columnId)

  if (error) {
    console.error('deleteColumn error:', error)
    throw error
  }
}

// update columns order
export const updateColumnsOrder = async (columns: Array<{ id: string; position: number }>) => {
  for (const column of columns) {
    const { error } = await supabase
      .from('columns')
      .update({ position: column.position })
      .eq('id', column.id)

    if (error) {
      console.error('updateColumnsOrder error:', error)
      throw error
    }
  }
}
