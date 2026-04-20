import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'

vi.mock('../providers/auth-context', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../providers/auth-context'

describe('ProtectedRoute', () => {
  it('shows loading state when auth is loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: true,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Private content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('does not render private content for unauthenticated user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Private content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.queryByText('Private content')).not.toBeInTheDocument()
  })

  it('renders children for authenticated user', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '123' },
      session: null,
      loading: false,
    } as never)

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Private content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Private content')).toBeInTheDocument()
  })
})
