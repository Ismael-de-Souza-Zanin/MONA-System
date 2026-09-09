import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  style?: CSSProperties
}

export function Card({ children, className = '', onClick, hover, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`fv-card p-5 ${hover ? 'cursor-pointer transition hover:-translate-y-0.5 hover:border-brand-500/40' : ''} ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}
