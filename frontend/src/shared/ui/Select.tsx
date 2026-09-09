import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`max-w-full min-w-0 rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-800 focus:ring-4 focus:ring-brand-800/10 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
