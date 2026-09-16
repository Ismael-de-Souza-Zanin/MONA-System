import type { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export function Checkbox({ label = '', className = '', id, ...props }: CheckboxProps) {
  const checkboxId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <label htmlFor={checkboxId} className={`mona-check ${className}`.trim()}>
      <input id={checkboxId} type="checkbox" className="mona-check__input" {...props} />
      {label ? <span>{label}</span> : null}
    </label>
  )
}
