import iconUrl from '../../assets/icon.png'
import wordmarkUrl from '../../assets/logo-wordmark.png'
import markUrl from '../../assets/mark.png'

type BrandLogoProps = {
  size?: number
  className?: string
  title?: string
  subtitle?: string
  showWordmark?: boolean
  wordAsText?: boolean
  variant?: 'icon' | 'wordmark' | 'mark'
}

export function BrandLogo({
  size = 40,
  className = '',
  title = 'MONA',
  subtitle,
  showWordmark = false,
  wordAsText = false,
  variant = 'icon',
}: BrandLogoProps) {
  if (variant === 'wordmark') {
    return (
      <img
        src={wordmarkUrl}
        alt={title}
        className={`h-auto w-auto max-w-full object-contain object-left ${className}`.trim()}
        style={{ height: size, maxWidth: '100%' }}
        draggable={false}
      />
    )
  }

  if (variant === 'mark') {
    return (
      <img
        src={markUrl}
        alt={title}
        width={size}
        height={size}
        className={`object-contain ${className}`.trim()}
        style={{ width: size, height: size }}
        draggable={false}
      />
    )
  }

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span className="relative block shrink-0" style={{ width: size, height: size }}>
        <img
          src={iconUrl}
          alt={title}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
      {showWordmark && (
        <div className="min-w-0">
          {wordAsText ? (
            <span className="mona-wordmark-text">{title}</span>
          ) : (
            <img
              src={wordmarkUrl}
              alt=""
              className="block w-auto max-w-[9.5rem] object-contain object-left"
              style={{ height: Math.max(18, Math.round(size * 0.46)) }}
              draggable={false}
            />
          )}
          {subtitle ? (
            <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

export { iconUrl, wordmarkUrl as logoUrl, markUrl }
