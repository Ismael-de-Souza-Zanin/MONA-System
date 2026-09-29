import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  illustration?: string
  action?: ReactNode
}

export function EmptyState({ title, description, illustration, action }: EmptyStateProps) {
  return (
    <div className={`mona-empty${illustration ? ' mona-empty--illustrated' : ''}`}>
      {illustration && <img className="mona-empty__illustration" src={illustration} alt="" loading="lazy" />}
      <p className="mona-empty__title">{title}</p>
      {description && <p className="mona-empty__description">{description}</p>}
      {action && <div className="mona-empty__action">{action}</div>}
    </div>
  )
}
