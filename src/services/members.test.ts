import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addBoardMember, findUserByEmail, getUserBoardRole, removeBoardMember } from './members'
import { supabase } from './supabase'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('members service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets user role in board', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { role: 'member' },
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await getUserBoardRole('board-1', 'user-1')

    expect(result).toEqual({ role: 'member' })
  })

  it('finds user by email', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'user-2', email: 'test@mail.com' },
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await findUserByEmail('test@mail.com')

    expect(result).toEqual({ id: 'user-2', email: 'test@mail.com' })
  })

  it('adds board member', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'm1', board_id: 'b1', user_id: 'u1', role: 'member' }],
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await addBoardMember('b1', 'u1', 'member')

    expect(result.role).toBe('member')
  })

  it('removes board member', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }

    chain.eq.mockReturnValueOnce(chain).mockResolvedValueOnce({ error: null })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await removeBoardMember('b1', 'u1')

    expect(chain.delete).toHaveBeenCalled()
  })
})
