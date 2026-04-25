import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  getTasksByColumnIds,
  reorderTasks,
  updateTask,
} from './tasks'
import { supabase } from './supabase'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('tasks service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gets tasks by one column', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ id: 'task-1', title: 'Task 1' }],
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await getTasks('col-1')

    expect(supabase.from).toHaveBeenCalledWith('tasks')
    expect(chain.eq).toHaveBeenCalledWith('column_id', 'col-1')
    expect(result).toEqual([{ id: 'task-1', title: 'Task 1' }])
  })

  it('throws when getTasks fails', async () => {
    const serviceError = new Error('Failed to load tasks')

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: serviceError,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(getTasks('col-1')).rejects.toThrow('Failed to load tasks')
  })

  it('returns empty array when column ids are empty', async () => {
    const result = await getTasksByColumnIds([])

    expect(result).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('gets tasks by many column ids', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    }

    chain.order.mockReturnValueOnce(chain).mockResolvedValueOnce({
      data: [
        { id: 'task-1', column_id: 'col-1' },
        { id: 'task-2', column_id: 'col-2' },
      ],
      error: null,
    })

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await getTasksByColumnIds(['col-1', 'col-2'])

    expect(chain.in).toHaveBeenCalledWith('column_id', ['col-1', 'col-2'])
    expect(result).toEqual([
      { id: 'task-1', column_id: 'col-1' },
      { id: 'task-2', column_id: 'col-2' },
    ])
  })

  it('creates task with next position', async () => {
    const loadChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'task-1' }, { id: 'task-2' }],
        error: null,
      }),
    }

    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'task-3',
          column_id: 'col-1',
          title: 'New task',
          position: 2,
        },
        error: null,
      }),
    }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(loadChain as never)
      .mockReturnValueOnce(insertChain as never)

    const result = await createTask('col-1', 'New task')

    expect(insertChain.insert).toHaveBeenCalledWith([
      {
        column_id: 'col-1',
        title: 'New task',
        priority: 'medium',
        position: 2,
      },
    ])

    expect(result).toEqual({
      id: 'task-3',
      column_id: 'col-1',
      title: 'New task',
      position: 2,
    })
  })

  it('throws when createTask initial load fails', async () => {
    const serviceError = new Error('Failed to load existing tasks')

    const loadChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: serviceError,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(loadChain as never)

    await expect(createTask('col-1', 'New task')).rejects.toThrow('Failed to load existing tasks')
  })

  it('updates task', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'task-1', title: 'Updated' },
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await updateTask('task-1', { title: 'Updated' })

    expect(chain.update).toHaveBeenCalledWith({ title: 'Updated' })
    expect(chain.eq).toHaveBeenCalledWith('id', 'task-1')
    expect(result).toEqual({ id: 'task-1', title: 'Updated' })
  })

  it('throws when updateTask fails', async () => {
    const serviceError = new Error('Failed to update task')

    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: serviceError,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(updateTask('task-1', { title: 'Updated' })).rejects.toThrow(
      'Failed to update task'
    )
  })

  it('reorders tasks', async () => {
    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await reorderTasks([
      { id: 'task-1', column_id: 'col-1', position: 0 },
      { id: 'task-2', column_id: 'col-1', position: 1 },
    ])

    expect(chain.update).toHaveBeenCalledTimes(2)
  })

  it('throws when reorderTasks fails', async () => {
    const serviceError = new Error('Failed to reorder tasks')

    const chain = {
      update: vi.fn().mockReturnThis(),
      eq: vi
        .fn()
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: serviceError }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(
      reorderTasks([
        { id: 'task-1', column_id: 'col-1', position: 0 },
        { id: 'task-2', column_id: 'col-1', position: 1 },
      ])
    ).rejects.toThrow('Failed to reorder tasks')
  })

  it('deletes task', async () => {
    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await deleteTask('task-1')

    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', 'task-1')
  })

  it('throws when deleteTask fails', async () => {
    const serviceError = new Error('Failed to delete task')

    const chain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: serviceError,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    await expect(deleteTask('task-1')).rejects.toThrow('Failed to delete task')
  })

  it('gets task by id', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'task-1', title: 'Task 1' },
        error: null,
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(chain as never)

    const result = await getTaskById('task-1')

    expect(result).toEqual({ id: 'task-1', title: 'Task 1' })
  })
})
