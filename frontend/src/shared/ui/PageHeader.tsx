import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mona-page__header">
      <div>
        <h1 className="mona-page__title">{title}</h1>
        {subtitle && <p className="mona-page__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="mona-page__actions">{actions}</div>}
    </header>
  )
}
