import './index.scss'

type ToastType = 'success' | 'error'

type ToastProps = {
  message: string
  type: ToastType
  onClose: () => void
}

// simple toast
export default function Toast({ message, type, onClose }: ToastProps) {
  if (!message) return null

  return (
    <div className={`toast toast--${type}`}>
      <span className='toast__message'>{message}</span>

      <button type='button' className='toast__close' onClick={onClose}>
        ×
      </button>
    </div>
  )
}
