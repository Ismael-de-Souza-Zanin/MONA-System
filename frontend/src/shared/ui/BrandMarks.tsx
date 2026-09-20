import { useId } from 'react'

export const MONA_BRAND = {
  purple: '#582B86',
  lilac: '#8B4BB8',
  rose: '#F54D7D',
  orange: '#FF7A33',
} as const

export type MarkTone = 'brand' | 'purple' | 'rose' | 'orange'

type MarkProps = {
  className?: string
  tone?: MarkTone
}

function toneColor(tone: MarkTone) {
  if (tone === 'purple') return MONA_BRAND.purple
  if (tone === 'rose') return MONA_BRAND.rose
  if (tone === 'orange') return MONA_BRAND.orange
  return null
}

function BrandGradient({ id, opacity = 1 }: { id: string; opacity?: number }) {
  return (
    <linearGradient id={id} x1="8" y1="80" x2="80" y2="8" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor={MONA_BRAND.purple} stopOpacity={opacity} />
      <stop offset="38%" stopColor={MONA_BRAND.lilac} stopOpacity={opacity} />
      <stop offset="72%" stopColor={MONA_BRAND.rose} stopOpacity={opacity * 0.95} />
      <stop offset="100%" stopColor={MONA_BRAND.orange} stopOpacity={opacity} />
    </linearGradient>
  )
}

export function MonaArrow({ className = '', tone = 'purple' }: MarkProps) {
  const id = useId()
  const solid = toneColor(tone)
  return (
    <svg viewBox="0 0 88 88" className={className} aria-hidden>
      {!solid && (
        <defs>
          <BrandGradient id={id} />
        </defs>
      )}
      <path
        fill={solid || `url(#${id})`}
        transform="rotate(-90 44 44)"
        d="M18 70c0-3.3 2.7-6 6-6h22.2L22.4 40.2a6 6 0 0 1 8.5-8.5L54.7 55.5V33.2c0-3.3 2.7-6 6-6h.3c3.3 0 6 2.7 6 6v37.6c0 5-4 9-9 9H24c-3.3 0-6-2.7-6-6Z"
      />
    </svg>
  )
}

export function MonaFolder({ className = '', tone = 'purple' }: MarkProps) {
  const id = useId()
  const solid = toneColor(tone)
  return (
    <svg viewBox="0 0 88 72" className={className} aria-hidden>
      {!solid && (
        <defs>
          <BrandGradient id={id} />
        </defs>
      )}
      <path
        fill="none"
        stroke={solid || `url(#${id})`}
        strokeWidth="5"
        strokeLinejoin="round"
        d="M8 24.5h18.5l7-7.5H78c2.8 0 5 2.2 5 5V60c0 3.3-2.7 6-6 6H11c-3.3 0-6-2.7-6-6V29.5c0-2.8 2.2-5 5-5Z"
      />
    </svg>
  )
}

export function MonaWave({ className = '', tone = 'brand' }: MarkProps) {
  const id = useId()
  const solid = toneColor(tone)
  return (
    <svg viewBox="0 0 220 90" className={className} aria-hidden>
      <defs>
        {solid ? null : <BrandGradient id={id} opacity={0.42} />}
      </defs>
      <path
        fill={solid ? solid : `url(#${id})`}
        fillOpacity={solid ? 0.28 : 1}
        d="M8 58c22-28 38-38 62-30 18 6 28 22 48 20 22-2 32-24 54-28 18-3 32 8 40 22 2 22-18 38-46 40-24 2-38-10-58-8-22 2-30 18-52 18C28 92 2 78 8 58Z"
      />
    </svg>
  )
}
