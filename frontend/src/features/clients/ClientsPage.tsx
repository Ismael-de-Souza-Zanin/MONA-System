import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, ChevronRight, MessageCircle, MoreHorizontal, Search, SlidersHorizontal, UserPlus, Users } from 'lucide-react'
import clientsIllustration from '../../assets/illustrations/clients.png'
import { api } from '../../shared/api/client'
import type { Client, ClientStatus, ClientStatusChangeRequest, ClientStatusCounts } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Checkbox,
  DropdownItem,
  DropdownMenu,
  EmptyState,
  ErrorAlert,
  Input,
  LoadingSpinner,
  MobileAvatar,
  MobileChip,
  MobileChips,
  MobilePageHeader,
  MobileStat,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  getStatusLabel,
} from '../../shared/ui'

const STATUS_COUNT_KEYS: Record<Exclude<ClientStatus | 'all', 'all'>, keyof ClientStatusCounts> = {
  Active: 'active',
  Inactive: 'inactive',
  Notice: 'notice',
  Hold: 'hold',
}

const STATUS_FILTERS: { value: ClientStatus | 'all'; label: string; tone?: 'purple' | 'rose' | 'orange' | 'mint' }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Active', label: 'Ativos', tone: 'mint' },
  { value: 'Inactive', label: 'Inativos' },
  { value: 'Notice', label: 'Aviso prévio', tone: 'rose' },
  { value: 'Hold', label: 'Em hold', tone: 'orange' },
]

function phoneDigits(phone?: string) {
  return (phone || '').replace(/\D/g, '')
}

function ClientStatusModal({
  client,
  open,
  onClose,
}: {
  client: Client | null
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [targetStatus, setTargetStatus] = useState<ClientStatus>('Hold')
  const [emailSent, setEmailSent] = useState(false)
  const [paymentSettled, setPaymentSettled] = useState(false)
  const [finalMessageSent, setFinalMessageSent] = useState(false)
  const [pendingResolved, setPendingResolved] = useState(false)
  const [removedFromGroup, setRemovedFromGroup] = useState(false)
  const [error, setError] = useState('')

  const { data: hasPendingTodos } = useQuery({
    queryKey: ['client-pending-todos', client?.id],
    queryFn: () => api.get<{ hasPending: boolean }>(`/clients/${client!.id}/pending-todos`),
    enabled: open && !!client && targetStatus === 'Inactive',
  })

  const mutation = useMutation({
    mutationFn: (body: ClientStatusChangeRequest) =>
      api.post(`/clients/${client!.id}/status`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  if (!client) return null

  const allowedTargets: ClientStatus[] =
    client.status === 'Active'
      ? ['Hold', 'Notice']
      : client.status === 'Hold' || client.status === 'Notice'
        ? ['Inactive']
        : []

  const needsEmailCheck = targetStatus === 'Hold' || targetStatus === 'Notice'
  const needsInactiveChecks = targetStatus === 'Inactive'
  const blockedByTodos = hasPendingTodos?.hasPending && targetStatus === 'Inactive'

  const canSubmit =
    allowedTargets.includes(targetStatus) &&
    (!needsEmailCheck || emailSent) &&
    (!needsInactiveChecks ||
      (paymentSettled &&
        finalMessageSent &&
        pendingResolved &&
        removedFromGroup &&
        !blockedByTodos))

  return (
    <Modal open={open} onClose={onClose} title="Alterar status" size="lg">
      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}
        <p className="text-sm text-teal-800">
          Cliente: <strong>{client.name}</strong> — status atual:{' '}
          <StatusBadge status={client.status} />
        </p>
        <Select
          label="Novo status"
          value={targetStatus}
          onChange={(e) => setTargetStatus(e.target.value as ClientStatus)}
        >
          {allowedTargets.map((s) => (
            <option key={s} value={s}>
              {getStatusLabel(s)}
            </option>
          ))}
        </Select>

        {client.status === 'Active' && (
          <div className="rounded-lg bg-sand-50 p-3 text-sm text-teal-800">
            De <strong>ativo</strong>, só é possível ir para <strong>em hold</strong> ou{' '}
            <strong>aviso prévio</strong>. Não é permitido ir direto para inativo.
          </div>
        )}

        {needsEmailCheck && (
          <Checkbox
            completion
            label="E-mail com a solicitação foi enviado ao cliente e entrou em vigor"
            checked={emailSent}
            onChange={(e) => setEmailSent(e.target.checked)}
          />
        )}

        {needsInactiveChecks && (
          <div className="space-y-2 rounded-lg border border-sand-200 p-3">
            <p className="text-sm font-medium text-teal-900">Checklist para inativar</p>
            <Checkbox
              completion
              label="Pagamento pendente foi realizado"
              checked={paymentSettled}
              onChange={(e) => setPaymentSettled(e.target.checked)}
            />
            <Checkbox
              completion
              label="Mensagem final foi enviada"
              checked={finalMessageSent}
              onChange={(e) => setFinalMessageSent(e.target.checked)}
            />
            <Checkbox
              completion
              label="Todas as pendências foram resolvidas"
              checked={pendingResolved}
              disabled={blockedByTodos}
              onChange={(e) => setPendingResolved(e.target.checked)}
            />
            {blockedByTodos && (
              <p className="text-xs text-red-600">
                Existem tasks no to do list direcionadas a este cliente.
              </p>
            )}
            <Checkbox
              completion
              label="Cliente removido do grupo e responsáveis (exceto pessoal e número da empresa)"
              checked={removedFromGroup}
              onChange={(e) => setRemovedFromGroup(e.target.checked)}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!canSubmit || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                status: targetStatus,
                emailSent,
                paymentSettled,
                finalMessageSent,
                pendingResolved,
                removedFromGroup,
              })
            }
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AddClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', phone: '', companyName: '', email: '' })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/clients', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clients'] })
      onClose()
      setForm({ name: '', phone: '', companyName: '', email: '' })
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Modal open={open} onClose={onClose} title="Adicionar cliente">
      <div className="space-y-4">
        {error && <ErrorAlert message={error} />}
        <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Empresa" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
        <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>Salvar</Button>
        </div>
      </div>
    </Modal>
  )
}

export function ClientsPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.ClientsWrite)
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [statusClient, setStatusClient] = useState<Client | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    if (searchParams.get('novo') !== '1') return
    if (canWrite) setShowAdd(true)
  }, [searchParams, canWrite])

  const closeAdd = () => {
    setShowAdd(false)
    if (searchParams.has('novo')) setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('novo')
      return next
    }, { replace: true })
  }
  const [showGroupFilter, setShowGroupFilter] = useState(false)
  const qc = useQueryClient()

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) setSearch(q)
    const g = searchParams.get('group')
    if (g) setGroupFilter(g)
  }, [searchParams])

  const { data: groups = [] } = useQuery({
    queryKey: ['client-groups'],
    queryFn: () => api.get<{ id: string; name: string; color: string }[]>('/client-groups'),
    retry: 1,
  })

  const {
    data: clients = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<Client[]>('/clients'),
  })

  const { data: counts } = useQuery({
    queryKey: ['clients-counts'],
    queryFn: () => api.get<ClientStatusCounts>('/clients/counts'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['clients'] }),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clients
      .filter((c) => statusFilter === 'all' || c.status === statusFilter)
      .filter((c) => groupFilter === 'all' || c.clientGroupId === groupFilter)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.companyName?.toLowerCase().includes(q),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [clients, search, statusFilter, groupFilter])

  if (isLoading) return <LoadingSpinner />

  const attention = clients.filter(
    (client) => client.status === 'Notice' || client.status === 'Hold' || client.needsQuickResponse,
  ).length

  return (
    <div className="min-w-0">
      <div className="mona-phone mona-m-stack">
        <MobilePageHeader title="Clientes" />
        <div className="mona-m-stats is-pair">
          <MobileStat icon={Users} label="Clientes ativos" value={counts?.active ?? clients.filter((c) => c.status === 'Active').length} hint={`${counts?.total ?? clients.length} na carteira`} tone="purple" />
          <MobileStat icon={Calendar} label="Em atenção" value={attention} hint="aviso, hold ou resposta rápida" tone="orange" />
        </div>
        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Não foi possível carregar a lista ({(error as Error)?.message || 'erro'}).
            <button type="button" className="ml-2 font-medium underline" onClick={() => void refetch()}>Tentar de novo</button>
          </div>
        )}
        <div className="mona-m-toolbar">
          <label className="mona-m-search">
            <Search size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente ou empresa..." />
          </label>
          <button type="button" className="mona-m-filter" aria-expanded={showGroupFilter} onClick={() => setShowGroupFilter((open) => !open)}>
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>
        {showGroupFilter && (
          <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} aria-label="Grupo">
            <option value="all">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        )}
        <MobileChips>
          {STATUS_FILTERS.map((f) => (
            <MobileChip key={f.value} active={statusFilter === f.value} tone={f.tone} onClick={() => setStatusFilter(f.value)}>
              {f.label}
              {f.value === 'all' ? ` (${counts?.total ?? clients.length})` : counts ? ` (${counts[STATUS_COUNT_KEYS[f.value]] ?? 0})` : ''}
            </MobileChip>
          ))}
        </MobileChips>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado" />
        ) : (
          <div className="mona-m-list">
            {filtered.map((client) => {
              const digits = phoneDigits(client.phone)
              return (
                <article key={client.id} className="mona-m-person">
                  <Link to={`/clientes/${client.id}`} className="mona-m-person__main">
                    <MobileAvatar name={client.name} />
                    <div>
                      <strong>{client.name}</strong>
                      <p>{client.companyName || client.clientGroupName || 'Sem empresa'}</p>
                      <span className={`mona-m-badge is-status-${client.status.toLowerCase()}`}>{getStatusLabel(client.status)}</span>
                    </div>
                  </Link>
                  <div className="mona-m-person__tools">
                    {digits ? (
                      <a href={`https://wa.me/${digits}`} aria-label={`Mensagem para ${client.name}`}><MessageCircle size={18} /></a>
                    ) : (
                      <Link to="/whatsapp" aria-label={`Mensagem para ${client.name}`}><MessageCircle size={18} /></Link>
                    )}
                    <Link to="/agenda" aria-label={`Agenda de ${client.name}`}><Calendar size={18} /></Link>
                    {canWrite && (
                      <DropdownMenu trigger={<span aria-label={`Ações de ${client.name}`}>⋯</span>}>
                        <DropdownItem onClick={() => setStatusClient(client)}>Alterar status</DropdownItem>
                        <DropdownItem danger onClick={() => { if (confirm('Excluir este cliente?')) deleteMutation.mutate(client.id) }}>Excluir</DropdownItem>
                      </DropdownMenu>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
        {canWrite && (
          <button type="button" className="mona-m-banner" onClick={() => setShowAdd(true)}>
            <span className="mona-m-icon"><UserPlus size={18} /></span>
            <span>
              <strong>Novo cliente</strong>
              <p>Cadastre um novo cliente e amplie suas oportunidades.</p>
            </span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <div className="mona-responsive-content mona-desk mona-management">
      <PageHeader
        title="Clientes"
        subtitle="Acompanhe a carteira, os vínculos e quem precisa de atenção."
        illustration={clientsIllustration}
        actions={
          canWrite && (
            <Button onClick={() => setShowAdd(true)}>Adicionar cliente</Button>
          )
        }
      />

      <div className="mona-management__stats">
        <MobileStat icon={Users} label="Na carteira" value={counts?.total ?? clients.length} hint="clientes cadastrados" tone="purple" />
        <MobileStat icon={Users} label="Ativos" value={counts?.active ?? clients.filter((c) => c.status === 'Active').length} hint="em atendimento" tone="mint" />
        <MobileStat icon={Calendar} label="Precisam de atenção" value={attention} hint="aviso, hold ou resposta rápida" tone="orange" />
      </div>

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível carregar a lista ({(error as Error)?.message || 'erro'}).
          <button type="button" className="ml-2 font-medium underline" onClick={() => void refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      <div className="mona-management__filters">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`mona-management__filter ${statusFilter === f.value ? 'is-active' : ''}`}
          >
            {f.label}
            {counts && f.value !== 'all' && (
              <span className="ml-1 opacity-70">
                ({counts[STATUS_COUNT_KEYS[f.value]] ?? 0})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mona-management__toolbar">
        <Input
          placeholder="Buscar por nome, telefone ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="min-w-[200px]"
        >
          <option value="all">Todos os grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={clients.length === 0 ? 'Sua carteira ainda está vazia' : 'Nenhum cliente neste filtro'}
          description={clients.length === 0 ? 'Cadastre o primeiro cliente para acompanhar seus vínculos e atendimentos.' : 'Ajuste a busca ou os filtros para encontrar outros clientes.'}
          illustration={clientsIllustration}
          action={clients.length === 0 && canWrite ? <Button onClick={() => setShowAdd(true)}>Adicionar cliente</Button> : undefined}
        />
      ) : (
        <div className="mona-clients-desktop__list">
          {filtered.map((client) => {
            const digits = phoneDigits(client.phone)
            return (
              <article key={client.id} className="mona-clients-desktop__row">
                <div className="mona-clients-desktop__identity">
                  <MobileAvatar name={client.name} />
                  <div className="mona-clients-desktop__name">
                    <Link to={`/clientes/${client.id}`} className="mona-management__link">{client.name}</Link>
                    <span>{client.companyName || 'Sem empresa'}</span>
                  </div>
                </div>
                <div className="mona-clients-desktop__details">
                  <StatusBadge status={client.status} />
                  {client.clientGroupName && (
                    <span className="mona-clients-desktop__group">
                      <span className="mona-clients-desktop__group-dot" style={{ backgroundColor: client.clientGroupColor || 'var(--mona-color-accent)' }} />
                      {client.clientGroupName}
                    </span>
                  )}
                  {client.needsQuickResponse && <span className="mona-clients-desktop__attention">Resposta rápida</span>}
                  {(client.preferredLanguage || client.marketCountry) && (
                    <span className="mona-clients-desktop__locale">{[client.preferredLanguage, client.marketCountry].filter(Boolean).join(' · ')}</span>
                  )}
                </div>
                <div className="mona-clients-desktop__actions">
                  {client.phone && <span className="mona-clients-desktop__phone">{client.phone}</span>}
                  {digits ? (
                    <a href={`https://wa.me/${digits}`} aria-label={`Mensagem para ${client.name}`} title="Enviar mensagem"><MessageCircle size={18} /></a>
                  ) : (
                    <Link to="/whatsapp" aria-label={`Mensagem para ${client.name}`} title="Abrir WhatsApp"><MessageCircle size={18} /></Link>
                  )}
                  <Link to="/agenda" aria-label={`Agenda de ${client.name}`} title="Abrir agenda"><Calendar size={18} /></Link>
                  {canWrite && (
                    <DropdownMenu trigger={<MoreHorizontal size={18} aria-label={`Ações de ${client.name}`} />}>
                      <DropdownItem onClick={() => setStatusClient(client)}>Alterar status</DropdownItem>
                      <DropdownItem danger onClick={() => { if (confirm('Excluir este cliente?')) deleteMutation.mutate(client.id) }}>Excluir</DropdownItem>
                    </DropdownMenu>
                  )}
                  <Link to={`/clientes/${client.id}`} aria-label={`Abrir ficha de ${client.name}`} title="Abrir ficha"><ChevronRight size={18} /></Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
      </div>

      <ClientStatusModal
        client={statusClient}
        open={!!statusClient}
        onClose={() => setStatusClient(null)}
      />
      <AddClientModal open={showAdd} onClose={closeAdd} />
    </div>
  )
}
