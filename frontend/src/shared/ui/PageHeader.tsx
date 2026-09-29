import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  illustration?: string
}

export function PageHeader({ title, subtitle, actions, illustration }: PageHeaderProps) {
  const heading = (
    <div>
      <h1 className="mona-page__title">{title}</h1>
      {subtitle && <p className="mona-page__subtitle">{subtitle}</p>}
    </div>
  )

  return (
    <header className="mona-page__header">
      {illustration ? (
        <div className="mona-page__heading">
          {heading}
          <img className="mona-page__illustration" src={illustration} alt="" />
        </div>
      ) : heading}
      {actions && <div className="mona-page__actions">{actions}</div>}
    </header>
  )
}
