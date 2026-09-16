import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="mona-field">
      {label && (
        <label htmlFor={textareaId} className="mona-field__label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`mona-field__control ${className}`.trim()}
        {...props}
      />
    </div>
  )
}
