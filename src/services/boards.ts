import { supabase } from './supabase'

// get all boards for current user
export const getBoards = async (userId: string) => {
  const { data: memberships, error: membershipError } = await supabase
    .from('board_members')
    .select('board_id')
    .eq('user_id', userId)

  if (membershipError) throw membershipError

  const boardIds = memberships.map((item) => item.board_id)

  if (boardIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .in('id', boardIds)
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
