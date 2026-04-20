import { createContext, useContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
