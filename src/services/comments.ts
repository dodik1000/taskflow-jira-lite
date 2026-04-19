import { supabase } from './supabase'

// get comments by task with profile data
export const getComments = async (taskId: string) => {
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (commentsError) throw commentsError

  if (!comments || comments.length === 0) {
    return []
  }

  const userIds = comments.map((comment) => comment.user_id)

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (profilesError) throw profilesError

  return comments.map((comment) => ({
    ...comment,
    profiles: profiles?.find((profile) => profile.id === comment.user_id) ?? null,
  }))
}

// create comment
export const createComment = async (taskId: string, userId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        task_id: taskId,
        user_id: userId,
        content,
      },
    ])
    .select()

  if (error) throw error
  return data[0]
}

// delete comment
export const deleteComment = async (commentId: string) => {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) throw error
}
