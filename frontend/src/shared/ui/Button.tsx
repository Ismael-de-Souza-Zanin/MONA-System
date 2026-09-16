import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  primary: 'mona-btn--primary',
  secondary: 'mona-btn--secondary',
  ghost: 'mona-btn--ghost',
  danger: 'mona-btn--danger',
} as const

const sizes = {
  sm: 'mona-btn--sm',
  md: 'mona-btn--md',
  lg: 'mona-btn--lg',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`mona-btn ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}
