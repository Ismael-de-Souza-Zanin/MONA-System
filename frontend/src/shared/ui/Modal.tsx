import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative w-full ${sizes[size]} overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl`}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 id="modal-title" className="text-lg font-semibold text-ink-900 app-font">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink-500 hover:bg-ink-50"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
