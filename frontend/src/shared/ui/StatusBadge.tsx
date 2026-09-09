import type { ClientStatus } from '../types'

const statusConfig: Record<
  ClientStatus,
  { label: string; color: string; bg: string }
> = {
  Active: { label: 'Ativo', color: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
  Inactive: { label: 'Inativo', color: 'bg-slate-400', bg: 'bg-slate-100 text-slate-600' },
  Notice: { label: 'Aviso prévio', color: 'bg-sky-500', bg: 'bg-sky-50 text-sky-700' },
  Hold: { label: 'Em hold', color: 'bg-orange-500', bg: 'bg-orange-50 text-orange-700' },
}

export function StatusDot({ status }: { status: ClientStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cfg.color}`}
      title={cfg.label}
    />
  )
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`fv-pill inline-flex items-center gap-1.5 ${cfg.bg}`}>
      <StatusDot status={status} />
      {cfg.label}
    </span>
  )
}

export function getStatusLabel(status: ClientStatus) {
  return statusConfig[status].label
}

export { statusConfig }
