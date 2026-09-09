import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Checkbox({ label = '', className = '', id, ...props }: CheckboxProps) {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label htmlFor={checkboxId} className={`flex cursor-pointer items-start gap-2 text-sm text-ink-900 ${className}`}>
      <input
        id={checkboxId}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-800 focus:ring-brand-800"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  )
}
