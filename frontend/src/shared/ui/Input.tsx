import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`mona-field${error ? ' is-invalid' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="mona-field__label">
          {label}
        </label>
      )}
      <input id={inputId} className={`mona-field__control ${className}`.trim()} {...props} />
      {error && <span className="mona-field__error">{error}</span>}
    </div>
  )
}
