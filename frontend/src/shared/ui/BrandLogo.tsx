import iconUrl from '../../assets/icon.png'
import wordmarkUrl from '../../assets/logo-wordmark.png'

type BrandLogoProps = {
  size?: number
  className?: string
  title?: string
  subtitle?: string
  showWordmark?: boolean
  variant?: 'icon' | 'wordmark'
}

export function BrandLogo({
  size = 40,
  className = '',
  title = 'MONA',
  subtitle,
  showWordmark = false,
  variant = 'icon',
}: BrandLogoProps) {
  if (variant === 'wordmark') {
    return (
      <img
        src={wordmarkUrl}
        alt={title}
        height={size}
        className={`h-auto max-w-full object-contain ${className}`.trim()}
        style={{ height: size }}
        draggable={false}
      />
    )
  }

  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <span
        className="relative shrink-0 overflow-hidden rounded-[22%] shadow-sm"
        style={{ width: size, height: size }}
      >
        <img
          src={iconUrl}
          alt={title}
          width={size}
          height={size}
          className="h-full w-full scale-[1.22] object-cover"
          draggable={false}
        />
      </span>
      {showWordmark && (
        <div className="min-w-0">
          <p className="mona-wordmark truncate text-[1.05rem] font-extrabold leading-none tracking-tight">{title}</p>
          {subtitle ? <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">{subtitle}</p> : null}
        </div>
      )}
    </div>
  )
}

export { iconUrl, wordmarkUrl as logoUrl }
