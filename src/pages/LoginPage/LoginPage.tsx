import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../../components/Loader/Loader'
import Toast from '../../components/Toast/Toast'
import { supabase } from '../../services/supabase'
import './index.scss'

type ToastState = {
  message: string
  type: 'success' | 'error'
}

// login page
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
  })

  const navigate = useNavigate()

  useEffect(() => {
    if (!toast.message) return

    const timer = setTimeout(() => {
      setToast({ message: '', type: 'success' })
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast])

  // handle login
  const handleLogin = async () => {
    try {
      setLoading(true)

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      navigate('/')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  // handle register
  const handleRegister = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) throw error

      const user = data.user

      if (user) {
        const defaultName = email.split('@')[0]

        const { error: profileError } = await supabase.from('profiles').upsert([
          {
            id: user.id,
            email: user.email,
            name: defaultName,
            avatar_url: null,
          },
        ])

        if (profileError) throw profileError
      }

      setToast({
        message: 'Registration successful! You can now log in.',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'

      setToast({
        message,
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login-page'>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className='login-page__card'>
        <h2 className='login-page__title'>TaskFlow</h2>

        <input
          className='login-page__input'
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <input
          className='login-page__input'
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        <div className='login-page__actions'>
          <button
            type='button'
            className='login-page__button'
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <Loader text='Please wait...' /> : 'Login'}
          </button>

          <button
            type='button'
            className='login-page__button login-page__button--secondary'
            onClick={handleRegister}
            disabled={loading}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  )
}
