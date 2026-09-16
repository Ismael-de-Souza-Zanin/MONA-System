import type { ClientStatus } from '../types'

const statusConfig: Record<ClientStatus, { label: string; modifier: string }> = {
  Active: { label: 'Ativo', modifier: 'mona-status--active' },
  Inactive: { label: 'Inativo', modifier: 'mona-status--inactive' },
  Notice: { label: 'Aviso prévio', modifier: 'mona-status--notice' },
  Hold: { label: 'Em hold', modifier: 'mona-status--hold' },
}

export function StatusDot({ status }: { status: ClientStatus }) {
  const cfg = statusConfig[status]
  return <span className={`mona-status__dot ${cfg.modifier}`} title={cfg.label} />
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={`mona-pill mona-status ${cfg.modifier}`}>
      <StatusDot status={status} />
      {cfg.label}
    </span>
  )
}

export function getStatusLabel(status: ClientStatus) {
  return statusConfig[status].label
}

export { statusConfig }
