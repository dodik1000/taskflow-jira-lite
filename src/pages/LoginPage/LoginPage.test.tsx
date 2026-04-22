import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { supabase } from '../../services/supabase'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument()
  })

  it('logs in user and navigates to boards page', async () => {
    const user = userEvent.setup()

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as never)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText('Email'), 'test@mail.com')
    await user.type(screen.getByPlaceholderText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@mail.com',
        password: '123456',
      })
    })

    expect(navigateMock).toHaveBeenCalledWith('/')
  })

  it('registers user and creates profile', async () => {
    const user = userEvent.setup()

    const upsertMock = vi.fn().mockResolvedValue({
      error: null,
    })

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'newuser@mail.com',
        },
        session: null,
      },
      error: null,
    } as never)

    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as never)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText('Email'), 'newuser@mail.com')
    await user.type(screen.getByPlaceholderText('Password'), '123456')
    await user.click(screen.getByRole('button', { name: 'Register' }))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@mail.com',
        password: '123456',
      })
    })

    expect(upsertMock).toHaveBeenCalledWith([
      {
        id: 'user-1',
        email: 'newuser@mail.com',
        name: 'newuser',
        avatar_url: null,
      },
    ])
  })
})
