import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current!
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    )).filter((element) => element.getClientRects().length > 0)
    dialog.focus()
    const handleKey = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[data-mona-dialog]')
      if (dialogs[dialogs.length - 1] !== dialog) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current() }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) { event.preventDefault(); dialog.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('keydown', handleKey, true)
      if (previous?.isConnected) previous.focus()
    }
  }, [open])
  if (!open) return null

  return createPortal(
    <div className="mona-modal">
      <div className="mona-modal__backdrop" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        data-mona-dialog
        tabIndex={-1}
        className={`mona-modal__dialog mona-modal__dialog--${size}`}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
      >
        <div className="mona-modal__header">
          <h2 id={titleId} className="mona-modal__title">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="mona-modal__close" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="mona-modal__body">{children}</div>
      </div>
    </div>, document.body,
  )
}
