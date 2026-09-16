import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="mona-field">
      {label && (
        <label htmlFor={selectId} className="mona-field__label">
          {label}
        </label>
      )}
      <select id={selectId} className={`mona-field__control ${className}`.trim()} {...props}>
        {children}
      </select>
    </div>
  )
}
