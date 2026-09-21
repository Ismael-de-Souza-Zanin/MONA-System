import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { BrandLogo } from './BrandLogo'
import { MonaWave } from './BrandMarks'

export function initialsFromName(name?: string) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function formatMoneyBr(value?: number) {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function isSameLocalDay(value?: string, day = new Date()) {
  if (!value) return false
  const date = new Date(value)
  return (
    date.getFullYear() === day.getFullYear() &&
    date.getMonth() === day.getMonth() &&
    date.getDate() === day.getDate()
  )
}

export function MobileHero({
  kicker,
  title,
  lead,
  cta,
  note = 'Mais para o que importa',
  art = 'mark',
}: {
  kicker?: string
  title: string
  lead?: string
  cta?: { to: string; label: string }
  note?: string
  art?: 'mark' | 'none'
}) {
  return (
    <section className="mona-m-hero">
      <MonaWave className="mona-m-hero__wave" />
      <div className="mona-m-hero__copy">
        {kicker ? <p className="mona-m-kicker">{kicker}</p> : null}
        <h1 className="mona-m-title">{title}</h1>
        {lead ? <p className="mona-m-lead">{lead}</p> : null}
        {cta ? (
          <Link to={cta.to} className="mona-m-cta">
            {cta.label}
            <ArrowRight size={16} />
          </Link>
        ) : null}
      </div>
      {art === 'mark' ? (
        <div className="mona-m-hero__art" aria-hidden>
          <BrandLogo variant="mark" size={118} title="" />
        </div>
      ) : null}
      {note ? <p className="mona-m-note">{note}</p> : null}
    </section>
  )
}

export function MobileTip({
  title = 'Dica da MONA',
  children,
  to = '/faqs',
  onClick,
}: {
  title?: string
  children: ReactNode
  to?: string
  onClick?: () => void
}) {
  return (
    <Link to={to} className="mona-m-tip" onClick={onClick}>
      <span className="mona-m-icon">
        <Lightbulb size={16} />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
      <ArrowRight size={16} />
    </Link>
  )
}

export function MobileSection({
  title,
  action,
  children,
}: {
  title?: string
  action?: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="mona-m-section">
      {(title || action) && (
        <div className="mona-m-section__head">
          {title ? <h2>{title}</h2> : <span />}
          {action ? (
            <Link to={action.to}>
              {action.label}
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      )}
      {children}
    </section>
  )
}

export function MobileStat({
  to,
  icon: Icon,
  label,
  value,
  hint,
  progress,
  tone = 'purple',
}: {
  to?: string
  icon: typeof Lightbulb
  label: string
  value: ReactNode
  hint?: string
  progress?: number
  tone?: 'purple' | 'rose' | 'orange' | 'mint'
}) {
  const inner = (
    <>
      <p>
        <Icon size={15} />
        {label}
      </p>
      <strong>{value}</strong>
      {hint ? <span>{hint}</span> : null}
      {typeof progress === 'number' ? <MobileProgress value={progress} /> : null}
    </>
  )
  if (to) {
    return (
      <Link to={to} className={`mona-m-stat is-${tone}`}>
        {inner}
      </Link>
    )
  }
  return <div className={`mona-m-stat is-${tone}`}>{inner}</div>
}

export function MobileProgress({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <span className="mona-m-bar" aria-hidden>
      <i style={{ width: `${width}%` }} />
    </span>
  )
}

export function MobileQuickActions({
  items,
}: {
  items: { to: string; label: string; icon: typeof Lightbulb }[]
}) {
  return (
    <div className="mona-m-quick">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link key={item.label} to={item.to}>
            <span>
              <Icon size={18} strokeWidth={1.8} />
            </span>
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

export function MobileChips({ children }: { children: ReactNode }) {
  return <div className="mona-m-chips">{children}</div>
}

export function MobileChip({
  active,
  onClick,
  children,
  tone,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  tone?: 'purple' | 'rose' | 'orange' | 'mint'
}) {
  return (
    <button
      type="button"
      className={`mona-m-chip${active ? ' is-active' : ''}${tone ? ` is-${tone}` : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function MobileRow({
  to,
  icon,
  title,
  meta,
  extra,
  trailing,
}: {
  to?: string
  icon?: ReactNode
  title: ReactNode
  meta?: ReactNode
  extra?: ReactNode
  trailing?: ReactNode
}) {
  const body = (
    <>
      {icon}
      <div className="mona-m-row__body">
        <strong>{title}</strong>
        {meta ? <p>{meta}</p> : null}
        {extra}
      </div>
      {trailing}
    </>
  )
  if (to) {
    return (
      <Link to={to} className="mona-m-row">
        {body}
      </Link>
    )
  }
  return <div className="mona-m-row">{body}</div>
}

export function MobileAvatar({ name, src }: { name?: string; src?: string }) {
  if (src) {
    return <img className="mona-m-avatar" src={src} alt={name || ''} />
  }
  return <span className="mona-m-avatar">{initialsFromName(name)}</span>
}
