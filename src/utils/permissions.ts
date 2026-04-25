export type BoardRole = 'owner' | 'member' | ''

export const canManageBoardStructure = (role: BoardRole) => {
  return role === 'owner'
}

export const canManageMembers = (role: BoardRole) => {
  return role === 'owner'
}

export const canManageTasks = (role: BoardRole) => {
  return role === 'owner' || role === 'member'
}

export const canViewBoard = (role: BoardRole) => {
  return role === 'owner' || role === 'member'
}
