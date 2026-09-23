import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Bolt, CalendarDays, CheckSquare, Bell, Users, Plus } from 'lucide-react'
import { api } from '../../shared/api/client'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  ErrorAlert,
  Input,
  LoadingSpinner,
  PageHeader,
  Select,
} from '../../shared/ui'

type QueueItem = {
  id: string
  kind: string
  title: string
  body?: string
  link: string
  clientId?: string
  clientName?: string
  dueAtUtc?: string
  priority?: string
  meta?: string
}

type QueueResponse = {
  organization: {
    name: string
    kind: string
    defaultTimeZoneId: string
  }
  effectiveTimeZoneId: string
  summary: {
    alerts: number
    todos: number
    agenda: number
    clientsAttention: number
    total: number
  }
  byGroup: { id?: string; name: string; color: string; count: number }[]
  queue: QueueItem[]
}

type ClientGroup = {
  id: string
  name: string
  description?: string
  color: string
  clientCount: number
}

const KIND_LABEL: Record<string, string> = {
  alert: 'Alerta',
  todo: 'Tarefa',
  todo_overdue: 'Tarefa atrasada',
  agenda: 'Agenda',
  quick_response: 'Atendimento rápido',
  client_attention: 'Cliente',
}

function kindIcon(kind: string) {
  if (kind.startsWith('todo')) return CheckSquare
  if (kind === 'agenda') return CalendarDays
  if (kind === 'alert') return Bell
  return Users
}

export function OperationsPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.ClientsWrite)
  const qc = useQueryClient()
  const [newGroup, setNewGroup] = useState('')
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [kindFilter, setKindFilter] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['operations-queue'],
    queryFn: () => api.get<QueueResponse>('/operations/queue'),
    refetchInterval: 20_000,
  })

  const { data: groups = [], error: groupsError } = useQuery({
    queryKey: ['client-groups'],
    queryFn: () => api.get<ClientGroup[]>('/client-groups'),
    retry: 1,
  })

  const createGroup = useMutation({
    mutationFn: () => api.post('/client-groups', { name: newGroup }),
    onSuccess: () => {
      setNewGroup('')
      void qc.invalidateQueries({ queryKey: ['client-groups'] })
      void qc.invalidateQueries({ queryKey: ['operations-queue'] })
    },
  })

  if (error && !data) {
    return (
      <div className="space-y-3">
        <PageHeader title="Modo operação" subtitle="Não foi possível carregar a fila." />
        <ErrorAlert message={error.message} />
        <Button onClick={() => void refetch()}>Tentar novamente</Button>
      </div>
    )
  }
  if (isLoading || !data) return <LoadingSpinner />

  const summary = data.summary ?? {
    alerts: 0,
    todos: 0,
    agenda: 0,
    clientsAttention: 0,
    total: 0,
  }
  const byGroup = data.byGroup ?? []
  const queue = data.queue ?? []
  const query = search.trim().toLocaleLowerCase('pt-BR')
  const visibleQueue = queue
    .filter(
      (item) =>
        (!clientFilter || item.clientId === clientFilter) &&
        (!kindFilter || (kindFilter === 'todo' ? item.kind.startsWith('todo') : item.kind === kindFilter)) &&
        (!query ||
          [item.title, item.body, item.clientName, item.meta].some((value) =>
            value?.toLocaleLowerCase('pt-BR').includes(query),
          )),
    )
    .sort(
      (a, b) =>
        Number(b.priority === 'Urgent') - Number(a.priority === 'Urgent') ||
        Number(b.kind === 'todo_overdue') - Number(a.kind === 'todo_overdue') ||
        (a.dueAtUtc ? Date.parse(a.dueAtUtc) : Infinity) - (b.dueAtUtc ? Date.parse(b.dueAtUtc) : Infinity),
    )
  const queueClients = [
    ...new Map(
      queue.filter((item) => item.clientId).map((item) => [item.clientId!, item.clientName || 'Cliente']),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
  const hasFilters = !!(search || clientFilter || kindFilter)
  const clearFilters = () => {
    setSearch('')
    setClientFilter('')
    setKindFilter('')
  }
  const groupRows =
    groups.length > 0
      ? groups.map((g) => ({
          id: g.id,
          name: g.name,
          color: g.color,
          clientCount: g.clientCount,
        }))
      : byGroup.map((g) => ({
          id: g.id || g.name,
          name: g.name,
          color: g.color,
          clientCount: g.count,
        }))


  return (
    <div className="min-w-0">


      <div className="mona-responsive-content">
      <PageHeader
        title="Modo operação"
        subtitle={`${data.organization?.name ?? 'Org'}. Fila do dia para a equipe — organize clientes em grupos que vocês mesmos definem. Fuso ${data.effectiveTimeZoneId ?? '—'}.`}
      />
      {error && (
        <ErrorAlert message={`A atualização falhou. Exibindo a última fila carregada: ${error.message}`} />
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Na fila', value: summary.total, to: '#fila' },
          { label: 'Alertas', value: summary.alerts, to: '/notificacoes' },
          { label: 'Tarefas', value: summary.todos, to: '/todos' },
          { label: 'Agenda 24h', value: summary.agenda, to: '/agenda' },
          { label: 'Clientes', value: summary.clientsAttention, to: '/clientes' },
        ].map((c) => (
          <Link key={c.label} to={c.to}>
            <Card hover className="py-3">
              <p className="text-xs text-ink-500">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold text-ink-900">{c.value}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Bolt size={16} className="text-brand-800" />
            <h2 className="font-semibold text-ink-900">Seus grupos de clientes</h2>
          </div>
          <p className="mb-3 text-xs text-ink-500">
            Criados pela equipe — renomeie, apague, agrupe como fizer sentido no operacional. Sem catálogo fixo de
            “tipo de negócio” no produto.
          </p>
          {groupsError && <ErrorAlert message={groupsError.message} />}
          {createGroup.error && <ErrorAlert message={createGroup.error.message} />}
          <ul className="space-y-2">
            {groupRows.length === 0 && (
              <li className="rounded-xl border border-dashed border-ink-200 px-3 py-4 text-center text-sm text-ink-500">
                Nenhum grupo ainda — crie o primeiro abaixo.
              </li>
            )}
            {groupRows.map((g) => (
              <li key={g.id}>
                <Link
                  to={g.id && g.id.length > 20 ? `/clientes?group=${g.id}` : '/clientes'}
                  className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm hover:bg-ink-50"
                >
                  <span className="flex min-w-0 items-center gap-2 font-medium text-ink-900">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color || '#006D69' }} />
                    <span className="truncate">{g.name}</span>
                  </span>
                  <span className="shrink-0 text-ink-500">{g.clientCount}</span>
                </Link>
              </li>
            ))}
          </ul>
          {canWrite && (
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Novo grupo…"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              />
              <Button
                size="sm"
                disabled={!newGroup.trim()}
                onClick={() => createGroup.mutate()}
              >
                <Plus size={14} /> Criar
              </Button>
            </div>
          )}
        </Card>

        <Card className="bg-brand-50/40">
          <h2 className="font-semibold text-ink-900">Foco operacional (Ju / Fatto)</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-700">
            <li>Fila do dia: alertas, tarefas, agenda e clientes marcados para resposta rápida.</li>
            <li>Grupos e tags são da equipe — o sistema não impõe vertical de mercado.</li>
            <li>Idioma, fuso e mercado ficam no cliente para comunicação correta.</li>
            <li>Quando for comercializar, a mesma estrutura serve outras orgs/autônomas.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/whatsapp" className="text-sm font-medium text-brand-800 hover:underline">
              WhatsApp →
            </Link>
            <Link to="/emails" className="text-sm font-medium text-brand-800 hover:underline">
              E-mails →
            </Link>
            <Link to="/clientes" className="text-sm font-medium text-brand-800 hover:underline">
              Clientes →
            </Link>
          </div>
        </Card>
      </div>

      <div id="fila">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Fila de agora</h2>
            <p className="text-xs text-ink-500">Atualiza a cada 20s</p>
          </div>
          <div className="mb-3 grid gap-3 sm:grid-cols-3">
            <Input
              label="Buscar na fila"
              placeholder="Título, cliente ou descrição"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select label="Cliente na fila" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="">Todos os clientes</option>
              {queueClients.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select label="Tipo de pendência" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Object.entries(KIND_LABEL)
                .filter(([kind]) => kind !== 'todo_overdue')
                .map(([kind, label]) => (
                  <option key={kind} value={kind}>
                    {label}
                  </option>
                ))}
            </Select>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-500" role="status">
              {visibleQueue.length} de {queue.length} itens carregados · urgentes e atrasadas primeiro
            </p>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
          {queue.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">Fila limpa — bom momento para organizar grupos ou SOPs.</p>
          ) : visibleQueue.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">Nenhuma pendência corresponde aos filtros.</p>
          ) : (
            <ul className="space-y-2">
              {visibleQueue.map((item) => {
                const Icon = kindIcon(item.kind)
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      to={item.link}
                      className="flex items-start gap-3 rounded-xl border border-ink-100 px-3 py-3 transition hover:border-brand-500/30 hover:bg-brand-50/30"
                    >
                      <div className="mt-0.5 rounded-lg bg-ink-50 p-2 text-brand-800">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-ink-900">{item.title}</p>
                          <span className="rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink-600">
                            {KIND_LABEL[item.kind] || item.kind}
                          </span>
                          {item.priority === 'Urgent' && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                              urgente
                            </span>
                          )}
                        </div>
                        {item.body && <p className="mt-1 line-clamp-2 text-sm text-ink-600">{item.body}</p>}
                        <p className="mt-1 text-xs text-ink-500">
                          {item.clientName ? `${item.clientName} · ` : ''}
                          {item.meta || ''}
                          {item.dueAtUtc ? ` · ${new Date(item.dueAtUtc).toLocaleString('pt-BR')}` : ''}
                        </p>
                      </div>
                      <ArrowUpRight size={16} className="mt-1 shrink-0 text-ink-400" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>
      </div>
    </div>
  )
}
