interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-sand-300 bg-white/60 px-6 py-12 text-center">
      <p className="font-medium text-teal-900">{title}</p>
      {description && <p className="mt-1 text-sm text-teal-700/70">{description}</p>}
    </div>
  )
}
