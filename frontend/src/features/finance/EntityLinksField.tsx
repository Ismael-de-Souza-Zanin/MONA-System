import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { PaymentLink, PaymentLinkKind } from '../../shared/types'
import { Button, Select } from '../../shared/ui'

const KIND_OPTIONS: { value: PaymentLinkKind; label: string }[] = [
  { value: 'todo', label: 'Tarefa' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'sop', label: 'Procedimento (SOP)' },
  { value: 'sop-run', label: 'Execução de SOP' },
  { value: 'service', label: 'Serviço' },
  { value: 'contract', label: 'Contrato' },
]

function kindLabel(kind: string) {
  return KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind
}

type Option = { id: string; label: string }

type Props = {
  value: PaymentLink[]
  onChange: (next: PaymentLink[]) => void
  /** Quando informado, prioriza tarefas/agenda/contratos desse cliente. */
  clientId?: string | null
  compact?: boolean
}

export function EntityLinksField({ value, onChange, clientId, compact }: Props) {
  const [kind, setKind] = useState<PaymentLinkKind>('todo')
  const [pickId, setPickId] = useState('')

  const { data: options = [], isFetching } = useQuery({
    queryKey: ['entity-link-options', kind, clientId || ''],
    queryFn: async (): Promise<Option[]> => {
      if (kind === 'todo') {
        const rows = await api.get<{ id: string; title: string; clientId?: string }[]>('/todos')
        return rows
          .filter((r) => !clientId || !r.clientId || r.clientId === clientId)
          .map((r) => ({ id: r.id, label: r.title }))
      }
      if (kind === 'agenda') {
        const rows = await api.get<{ id: string; title: string; clientId?: string }[]>(
          '/agenda/events',
        )
        return rows
          .filter((r) => !clientId || !r.clientId || r.clientId === clientId)
          .map((r) => ({ id: r.id, label: r.title }))
      }
      if (kind === 'sop') {
        const rows = await api.get<{ id: string; name: string }[]>('/sops')
        return rows.map((r) => ({ id: r.id, label: r.name }))
      }
      if (kind === 'sop-run') {
        const rows = await api.get<
          { id: string; sopName?: string; status?: string; clientId?: string }[]
        >('/sops/runs/mine?status=all')
        return rows
          .filter((r) => !clientId || !r.clientId || r.clientId === clientId)
          .map((r) => ({
            id: r.id,
            label: `${r.sopName || 'SOP'} · ${r.status || 'em andamento'}`,
          }))
      }
      if (kind === 'service') {
        const rows = await api.get<{ id: string; title: string }[]>('/services')
        return rows.map((r) => ({ id: r.id, label: r.title }))
      }
      if (kind === 'contract') {
        const rows = await api.get<
          { id: string; name: string; clientId?: string; employeeId?: string; partyName?: string }[]
        >('/contracts')
        return rows
          .filter((r) => {
            if (!clientId) return true
            return r.clientId === clientId
          })
          .map((r) => ({
            id: r.id,
            label: r.partyName ? `${r.name} · ${r.partyName}` : r.name,
          }))
      }
      return []
    },
  })

  const available = options.filter(
    (o) => !value.some((v) => v.kind === kind && v.entityId === o.id),
  )

  function add() {
    const opt = available.find((o) => o.id === pickId)
    if (!opt) return
    onChange([
      ...value,
      {
        kind,
        entityId: opt.id,
        label: opt.label,
        path:
          kind === 'todo'
            ? '/todos'
            : kind === 'agenda'
              ? '/agenda'
              : kind === 'service'
                ? '/servicos'
                : kind === 'contract' && clientId
                  ? `/clientes/${clientId}`
                  : '/procedimentos',
      },
    ])
    setPickId('')
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div>
        <p className="text-sm font-medium text-ink-700">Vínculos operacionais</p>
        <p className="text-xs text-ink-500">
          Opcional — ligue a tarefas, agenda, procedimentos ou serviços (vários de cada tipo).
          Ajuda dashboards e histórico.
        </p>
      </div>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((link, idx) => (
            <li
              key={`${link.kind}-${link.entityId}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-xs text-ink-800 ring-1 ring-ink-200"
            >
              <span className="shrink-0 font-semibold text-ink-500">{kindLabel(link.kind)}</span>
              {link.path ? (
                <Link to={link.path} className="truncate text-brand-800 hover:underline">
                  {link.label}
                </Link>
              ) : (
                <span className="truncate">{link.label}</span>
              )}
              <button
                type="button"
                className="rounded-full p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                onClick={() => remove(idx)}
                aria-label="Remover vínculo"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <Select
          label="Tipo"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as PaymentLinkKind)
            setPickId('')
          }}
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </Select>
        <Select
          label="Item"
          value={pickId}
          onChange={(e) => setPickId(e.target.value)}
          disabled={isFetching || available.length === 0}
        >
          <option value="">
            {isFetching
              ? 'Carregando…'
              : available.length === 0
                ? kind === 'contract' && !clientId
                  ? 'Selecione um cliente primeiro'
                  : 'Nenhum item disponível'
                : 'Escolher…'}
          </option>
          {available.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <Button type="button" variant="secondary" size="sm" disabled={!pickId} onClick={add}>
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PaymentLinksChips({ links }: { links?: PaymentLink[] }) {
  if (!links?.length) return null
  return (
    <ul className="mt-1 flex flex-wrap gap-1">
      {links.map((l) => (
        <li key={`${l.kind}-${l.entityId}`}>
          {l.path ? (
            <Link
              to={l.path}
              className="inline-flex rounded-full bg-ink-50 px-2 py-0.5 text-[11px] text-ink-700 ring-1 ring-ink-100 hover:bg-ink-100"
            >
              {kindLabel(l.kind)}: {l.label}
            </Link>
          ) : (
            <span className="inline-flex rounded-full bg-ink-50 px-2 py-0.5 text-[11px] text-ink-700 ring-1 ring-ink-100">
              {kindLabel(l.kind)}: {l.label}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Payload para a API. */
export function linksToApi(links: PaymentLink[]) {
  return links.map((l) => ({ kind: l.kind, entityId: l.entityId }))
}
