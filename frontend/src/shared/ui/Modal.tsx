import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  return (
    <div className="mona-modal">
      <div className="mona-modal__backdrop" onClick={onClose} aria-hidden />
      <div
        className={`mona-modal__dialog mona-modal__dialog--${size}`}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div className="mona-modal__header">
          <h2 id="modal-title" className="mona-modal__title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="mona-modal__close" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="mona-modal__body">{children}</div>
      </div>
    </div>
  )
}
