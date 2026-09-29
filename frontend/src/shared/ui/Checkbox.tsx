import { useId, type InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  completion?: boolean
}

export function Checkbox({ label = '', className = '', completion = false, id, ...props }: CheckboxProps) {
  const generatedId = useId()
  const checkboxId = id || generatedId
  return (
    <div className={`mona-checklist${completion ? '' : ' mona-checklist--option'} ${className}`.trim()}>
      <input id={checkboxId} type="checkbox" {...props} />
      <label htmlFor={checkboxId}>{label}</label>
    </div>
  )
}
