import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-500/70 focus:border-brand-800 focus:ring-4 focus:ring-brand-800/10 ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
