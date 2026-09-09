import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg p-1 hover:bg-sand-100">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[160px] rounded-lg border border-sand-200 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  danger,
}: {
  children: ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-sand-50 ${danger ? 'text-red-600' : 'text-teal-900'}`}
    >
      {children}
    </button>
  )
}
