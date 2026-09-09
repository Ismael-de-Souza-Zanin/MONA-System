import { BrandLogo } from './BrandLogo'

export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-ink-100 border-t-brand-800" />
        <BrandLogo size={36} />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  )
}
