import { describe, expect, it } from 'vitest'
import {
  canManageBoardStructure,
  canManageMembers,
  canManageTasks,
  canViewBoard,
} from './permissions'

describe('permissions', () => {
  it('allows owner to manage board structure', () => {
    expect(canManageBoardStructure('owner')).toBe(true)
  })

  it('does not allow member to manage board structure', () => {
    expect(canManageBoardStructure('member')).toBe(false)
  })

  it('allows owner to manage members', () => {
    expect(canManageMembers('owner')).toBe(true)
  })

  it('does not allow member to manage members', () => {
    expect(canManageMembers('member')).toBe(false)
  })

  it('allows owner and member to manage tasks', () => {
    expect(canManageTasks('owner')).toBe(true)
    expect(canManageTasks('member')).toBe(true)
  })

  it('does not allow empty role to manage tasks', () => {
    expect(canManageTasks('')).toBe(false)
  })

  it('allows only owner and member to view board', () => {
    expect(canViewBoard('owner')).toBe(true)
    expect(canViewBoard('member')).toBe(true)
    expect(canViewBoard('')).toBe(false)
  })
})
