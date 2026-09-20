import { BrandLogo } from './BrandLogo'
import { MonaFolder } from './BrandMarks'

export function LoadingSpinner({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-500">
      <div className="mona-loader" aria-hidden>
        <MonaFolder className="mona-loader__folder" />
        <BrandLogo variant="mark" size={28} className="mona-loader__mark" />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  )
}
