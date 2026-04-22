import { supabase } from './supabase'

// get all accessible boards
export const getBoards = async () => {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// create new board
export const createBoard = async (title: string, userId: string) => {
  const { data, error } = await supabase
    .from('boards')
    .insert([
      {
        title,
        owner_id: userId,
      },
    ])
    .select()

  if (error) throw error

  const board = data[0]

  const { error: memberError } = await supabase.from('board_members').insert([
    {
      board_id: board.id,
      user_id: userId,
      role: 'owner',
    },
  ])

  if (memberError) throw memberError

  return board
}

// delete board
export const deleteBoard = async (id: string) => {
  const { error } = await supabase.from('boards').delete().eq('id', id)

  if (error) throw error
}

// get board by id
export const getBoardById = async (id: string) => {
  const { data, error } = await supabase.from('boards').select('*').eq('id', id).single()

  if (error) throw error
  return data
}
