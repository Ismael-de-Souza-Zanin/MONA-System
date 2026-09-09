import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  StatusDot,
  getStatusLabel,
} from '../../shared/ui'

const STATUS_COUNT_KEYS: Record<Exclude<ClientStatus | 'all', 'all'>, keyof ClientStatusCounts> = {
  Active: 'active',
  Inactive: 'inactive',
  Notice: 'notice',
  Hold: 'hold',
}

const STATUS_FILTERS: { value: ClientStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'Active', label: 'Ativos' },
  { value: 'Inactive', label: 'Inativos' },
  { value: 'Notice', label: 'Aviso prévio' },
  { value: 'Hold', label: 'Em hold' },
]

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
            label="E-mail com a solicitação foi enviado ao cliente e entrou em vigor"
            checked={emailSent}
            onChange={(e) => setEmailSent(e.target.checked)}
          />
        )}

        {needsInactiveChecks && (
          <div className="space-y-2 rounded-lg border border-sand-200 p-3">
            <p className="text-sm font-medium text-teal-900">Checklist para inativar</p>
            <Checkbox
              label="Pagamento pendente foi realizado"
              checked={paymentSettled}
              onChange={(e) => setPaymentSettled(e.target.checked)}
            />
            <Checkbox
              label="Mensagem final foi enviada"
              checked={finalMessageSent}
              onChange={(e) => setFinalMessageSent(e.target.checked)}
            />
            <Checkbox
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
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [statusClient, setStatusClient] = useState<Client | null>(null)
  const [showAdd, setShowAdd] = useState(false)
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

  return (
    <div className="min-w-0">
      <PageHeader
        title="Clientes totais"
        subtitle={`${counts?.total ?? clients.length} clientes · agrupe como a equipe definir`}
        actions={
          canWrite && (
            <Button onClick={() => setShowAdd(true)}>Adicionar cliente</Button>
          )
        }
      />

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível carregar a lista ({(error as Error)?.message || 'erro'}).
          <button type="button" className="ml-2 font-medium underline" onClick={() => void refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              statusFilter === f.value
                ? 'bg-teal-900 text-white'
                : 'bg-white text-teal-800 hover:bg-sand-100'
            }`}
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

      <div className="mb-4 flex flex-wrap gap-3">
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
        <EmptyState title="Nenhum cliente encontrado" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-sand-200 bg-white/90">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sand-200 bg-sand-50/80">
              <tr>
                <th className="px-4 py-3 font-medium text-teal-900">Status</th>
                <th className="px-4 py-3 font-medium text-teal-900">Nome</th>
                <th className="px-4 py-3 font-medium text-teal-900">Grupo</th>
                <th className="px-4 py-3 font-medium text-teal-900">Telefone</th>
                <th className="px-4 py-3 font-medium text-teal-900">Empresa</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} className="border-b border-sand-100 hover:bg-sand-50/50">
                  <td className="px-4 py-3">
                    <StatusDot status={client.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/clientes/${client.id}`} className="font-medium text-teal-900 hover:underline">
                      {client.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-1 text-[10px] text-ink-500">
                      {client.preferredLanguage && <span>{client.preferredLanguage}</span>}
                      {client.marketCountry && <span>· {client.marketCountry}</span>}
                      {client.needsQuickResponse && (
                        <span className="font-semibold text-red-600">· rápido</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-teal-700">
                    {client.clientGroupName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: client.clientGroupColor || '#006D69' }}
                        />
                        {client.clientGroupName}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-teal-700">{client.phone || '—'}</td>
                  <td className="px-4 py-3 text-teal-700">{client.companyName || '—'}</td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <DropdownMenu trigger={<span className="text-lg">⋯</span>}>
                        <DropdownItem onClick={() => setStatusClient(client)}>
                          Alterar status
                        </DropdownItem>
                        <DropdownItem
                          danger
                          onClick={() => {
                            if (confirm('Excluir este cliente?')) deleteMutation.mutate(client.id)
                          }}
                        >
                          Excluir
                        </DropdownItem>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientStatusModal
        client={statusClient}
        open={!!statusClient}
        onClose={() => setStatusClient(null)}
      />
      <AddClientModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  )
}
