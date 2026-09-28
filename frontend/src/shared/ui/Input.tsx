import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, type, ...props }: InputProps) {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const isPassword = type === 'password'
  const input = (
    <input
      id={inputId}
      type={isPassword && passwordVisible ? 'text' : type}
      className={`mona-field__control${isPassword ? ' has-trailing-action' : ''} ${className}`.trim()}
      {...props}
    />
  )

  return (
    <div className={`mona-field${error ? ' is-invalid' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="mona-field__label">
          {label}
        </label>
      )}
      {isPassword ? (
        <div className="mona-field__control-wrap">
          {input}
          <button
            type="button"
            className="mona-field__action"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={passwordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          </button>
        </div>
      ) : (
        input
      )}
      {error && <span className="mona-field__error">{error}</span>}
    </div>
  )
}
