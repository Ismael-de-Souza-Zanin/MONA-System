import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`min-h-[96px] rounded-xl border border-ink-300 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-800 focus:ring-4 focus:ring-brand-800/10 ${className}`}
        {...props}
      />
    </div>
  )
}
