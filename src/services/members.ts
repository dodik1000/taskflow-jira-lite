import { supabase } from './supabase'

// get board members with profile data
export const getBoardMembers = async (boardId: string) => {
  const { data: members, error: membersError } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId)

  if (membersError) throw membersError

  if (!members || members.length === 0) {
    return []
  }

  const userIds = members.map((member) => member.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (profilesError) throw profilesError

  return members.map((member) => ({
    ...member,
    profiles: profiles?.find((profile) => profile.id === member.user_id) ?? null,
  }))
}

// add member to board
export const addBoardMember = async (
  boardId: string,
  userId: string,
  role: 'owner' | 'member' = 'member'
) => {
  const { data, error } = await supabase
    .from('board_members')
    .insert([
      {
        board_id: boardId,
        user_id: userId,
        role,
      },
    ])
    .select()

  if (error) throw error
  return data[0]
}

// remove member from board
export const removeBoardMember = async (boardId: string, userId: string) => {
  const { error } = await supabase
    .from('board_members')
    .delete()
    .eq('board_id', boardId)
    .eq('user_id', userId)

  if (error) throw error
}

// get current user role in board
export const getUserBoardRole = async (boardId: string, userId: string) => {
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

// find user profile by email
export const findUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data
}
