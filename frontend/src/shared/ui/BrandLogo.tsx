import logoUrl from '../../assets/logo.png'

type BrandLogoProps = {
  size?: number
  className?: string
  /** Só o ícone (sem título ao lado) — o PNG já traz o nome da marca */
  title?: string
  subtitle?: string
  showWordmark?: boolean
}

export function BrandLogo({
  size = 36,
  className = '',
  title = 'Fatto Virtual',
  subtitle,
  showWordmark = false,
}: BrandLogoProps) {
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <img
        src={logoUrl}
        alt={title}
        width={size}
        height={size}
        className="shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/10"
        draggable={false}
      />
      {showWordmark && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-ink-900 brand-font">{title}</p>
          {subtitle ? <p className="truncate text-[11px] text-ink-500">{subtitle}</p> : null}
        </div>
      )}
    </div>
  )
}

export { logoUrl }
