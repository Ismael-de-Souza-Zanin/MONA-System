interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="mona-empty">
      <p className="mona-empty__title">{title}</p>
      {description && <p className="mona-empty__description">{description}</p>}
    </div>
  )
}
