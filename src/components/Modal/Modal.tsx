import type { ReactNode } from 'react'
import './index.scss'

type ModalProps = {
  title: string
  isOpen: boolean
  children: ReactNode
  onClose: () => void
}

// reusable modal
export default function Modal({ title, isOpen, children, onClose }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(event) => event.stopPropagation()}>
        <div className='modal__header'>
          <h3 className='modal__title'>{title}</h3>

          <button type='button' className='modal__close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='modal__content'>{children}</div>
      </div>
    </div>
  )
}
