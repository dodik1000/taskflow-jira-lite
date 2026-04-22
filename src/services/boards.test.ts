import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBoard, deleteBoard, getBoardById, getBoards } from './boards'
import { supabase } from './supabase'

vi.mock('./supabase', () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn(),
  }

  return {
    supabase: {
      from: vi.fn(() => chain),
    },
  }
})

describe('boards service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets boards ordered by created_at', async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: '1', title: 'Board 1' }],
      error: null,
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: orderMock,
    } as never)

    const result = await getBoards()

    expect(supabase.from).toHaveBeenCalledWith('boards')
    expect(result).toEqual([{ id: '1', title: 'Board 1' }])
  })

  it('gets board by id', async () => {
    const singleChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '1', title: 'Board 1' },
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(singleChain as never)

    const result = await getBoardById('1')

    expect(result).toEqual({ id: '1', title: 'Board 1' })
  })

  it('creates a board and owner membership', async () => {
    const boardsInsert = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [{ id: 'board-1', title: 'New Board', owner_id: 'user-1' }],
        error: null,
      }),
    }

    const membersInsert = {
      insert: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(boardsInsert as never)
      .mockReturnValueOnce(membersInsert as never)

    const result = await createBoard('New Board', 'user-1')

    expect(result.id).toBe('board-1')
    expect(membersInsert.insert).toHaveBeenCalledWith([
      {
        board_id: 'board-1',
        user_id: 'user-1',
        role: 'owner',
      },
    ])
  })

  it('deletes board by id', async () => {
    const deleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(deleteChain as never)

    await deleteBoard('board-1')

    expect(deleteChain.eq).toHaveBeenCalledWith('id', 'board-1')
  })
})
