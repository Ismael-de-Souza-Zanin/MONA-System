import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { Client, Contract, EmployeeSummary, SharedUser } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { Button, Card, EmptyState, LoadingSpinner, PageHeader, Select } from '../../shared/ui'

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000'

export function EmployeeSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const validId = !!id && id !== EMPTY_GUID
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.EmployeesWrite)
  const canContracts = hasPermission(Permissions.ContractsWrite)
  const canSettings = hasPermission(Permissions.Settings)
  const qc = useQueryClient()
  const [clientId, setClientId] = useState('')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['employee-summary', id],
    queryFn: () => api.get<EmployeeSummary>(`/employees/${id}/summary`),
    enabled: validId,
  })

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients-lite'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: canWrite && validId,
  })

  const { data: sharedUsers = [] } = useQuery({
    queryKey: ['shared-users'],
    queryFn: () => api.get<SharedUser[]>('/shared-users'),
    enabled: canSettings && validId,
  })

  const assign = useMutation({
    mutationFn: async () => {
      await api.post(`/employees/${id}/clients/${clientId}`, {})
      if (!canSettings || !clientId) return
      const email = summary?.email?.toLowerCase()
      if (!email) return
      const user = sharedUsers.find((u) => !u.isOwner && u.email?.toLowerCase() === email)
      if (!user || user.assignedClientIds.includes(clientId)) return
      await api.patch(`/shared-users/${user.id}`, {
        assignedClientIds: [...user.assignedClientIds, clientId],
      })
    },
    onSuccess: () => {
      setClientId('')
      void qc.invalidateQueries({ queryKey: ['employee-summary', id] })
      void qc.invalidateQueries({ queryKey: ['shared-users'] })
      void qc.invalidateQueries({ queryKey: ['client'] })
    },
  })

  const unassign = useMutation({
    mutationFn: (cid: string) => api.delete(`/employees/${id}/clients/${cid}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['employee-summary', id] }),
  })

  const createContract = useMutation({
    mutationFn: () =>
      api.post<Contract>('/contracts', {
        name: `Contrato — ${summary?.name}`,
        type: 'Provider',
        employeeId: id,
        status: 'Active',
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['employee-summary', id] }),
  })

  if (!validId) return <EmptyState title="Pessoa inválida" description="Volte à equipe e escolha alguém." />
  if (isLoading) return <LoadingSpinner />
  if (!summary) return <EmptyState title="Pessoa não encontrada" />

  const contracts = summary.contracts ?? []

  return (
    <div>
      <PageHeader
        title={summary.name}
        subtitle="Resumo na minha equipe"
        actions={
          <Link to="/prestadores">
            <Button variant="secondary" size="sm">← Minha equipe</Button>
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-3">
        <span
          className="h-8 w-8 rounded-full border border-ink-200"
          style={{ backgroundColor: summary.color || '#0F4C5C' }}
        />
        <div className="text-sm text-ink-600">
          {summary.phone && <span>{summary.phone} · </span>}
          {summary.email}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-ink-900 brand-font">Contratos (admin ↔ prestador)</h2>
            {canContracts && (
              <Button size="sm" variant="secondary" onClick={() => createContract.mutate()}>
                Novo
              </Button>
            )}
          </div>
          {contracts.length ? (
            <ul className="space-y-2 text-sm">
              {contracts.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                  <div>
                    <p className="font-medium text-ink-900">{c.name}</p>
                    <p className="text-xs text-ink-500">{c.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {c.pdfUrl && (
                      <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-800 hover:underline">
                        PDF
                      </a>
                    )}
                    <Link to="/contratos" className="text-ink-600 hover:underline">
                      Lista
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">
              {summary.contractNotes || 'Nenhum contrato de prestador cadastrado.'}
            </p>
          )}
          <Link to="/financeiro" className="mt-3 inline-block text-sm text-brand-800 hover:underline">
            Ir ao financeiro (vincular pagamento) →
          </Link>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 brand-font">Pagamentos</h2>
          {summary.payments?.length ? (
            <ul className="space-y-2 text-sm">
              {summary.payments.map((p) => (
                <li key={p.id} className="flex justify-between rounded-lg bg-ink-50 px-3 py-2">
                  <span>{p.description || 'Pagamento'}</span>
                  <span className="font-medium">
                    R$ {p.amount.toFixed(2)} — {p.status === 'Paid' ? 'Pago' : 'Pendente'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum pagamento registrado.</p>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 brand-font">Clientes direcionados</h2>
          <p className="mb-3 text-xs text-ink-500">
            Ao vincular, o login na MONA também é liberado se ela já tiver conta. Também dá pela aba
            Equipe na ficha do cliente.
          </p>
          {summary.assignedClients?.length ? (
            <ul className="space-y-1 text-sm">
              {summary.assignedClients.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <Link to={`/clientes/${c.id}`} className="text-brand-800 hover:underline">
                    {c.name}
                  </Link>
                  {canWrite && (
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
                      onClick={() => unassign.mutate(c.id)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum cliente atribuído.</p>
          )}
          {canWrite && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Select
                label="Vincular cliente"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="min-w-[200px]"
              >
                <option value="">Selecione…</option>
                {allClients
                  .filter((c) => !summary.assignedClients?.some((a) => a.id === c.id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </Select>
              <Button size="sm" disabled={!clientId || assign.isPending} onClick={() => assign.mutate()}>
                Vincular
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 brand-font">To do list</h2>
          {summary.todos?.length ? (
            <ul className="space-y-2 text-sm">
              {summary.todos.map((t) => (
                <li key={t.id} className="rounded-lg bg-ink-50 px-3 py-2">
                  <Link to="/todos" className="hover:underline">{t.title}</Link>
                  <span className="ml-2 text-xs text-ink-500">
                    {t.status === 'Todo' ? 'A fazer' : t.status === 'InProgress' ? 'Em progresso' : 'Concluída'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhuma task.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold text-ink-900 brand-font">
            Calendário — dias trabalhados e folgas
          </h2>
          {summary.workDays?.length ? (
            <div className="flex flex-wrap gap-2">
              {summary.workDays.map((d) => (
                <span
                  key={d.date}
                  className={`rounded-lg px-2 py-1 text-xs font-medium ${
                    d.type === 'work' ? 'bg-brand-100 text-brand-900' : 'bg-ink-100 text-ink-700'
                  }`}
                >
                  {d.date} · {d.type === 'work' ? 'trabalho' : 'folga'}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-500">Sem escala cadastrada.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
