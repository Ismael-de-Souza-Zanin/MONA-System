import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { Client, Contract, Employee } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  PdfViewer,
  Select,
} from '../../shared/ui'

function ContractFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: Partial<Contract> | null
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    type: (initial?.type ?? 'Client') as 'Client' | 'Provider',
    status: initial?.status ?? 'Active',
    clientId: initial?.clientId ?? '',
    employeeId: initial?.employeeId ?? '',
  })
  const [pdf, setPdf] = useState<File | null>(null)

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-lite'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: open && form.type === 'Client',
  })
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-lite'],
    queryFn: () => api.get<Employee[]>('/employees'),
    enabled: open && form.type === 'Provider',
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name,
        type: form.type,
        status: form.status,
        clientId: form.type === 'Client' ? form.clientId || null : null,
        employeeId: form.type === 'Provider' ? form.employeeId || null : null,
      }
      const created = initial?.id
        ? await api.put<Contract>(`/contracts/${initial.id}`, body)
        : await api.post<Contract>('/contracts', body)
      if (pdf) {
        const fd = new FormData()
        fd.append('file', pdf)
        await api.postForm(`/contracts/${created.id}/pdf`, fd)
      }
      return created
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['contracts'] })
      void qc.invalidateQueries({ queryKey: ['client'] })
      void qc.invalidateQueries({ queryKey: ['employee-summary'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Editar contrato' : 'Novo contrato'}>
      <div className="space-y-3">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Select
          label="Tipo"
          value={form.type}
          onChange={(e) =>
            setForm({
              ...form,
              type: e.target.value as 'Client' | 'Provider',
              clientId: '',
              employeeId: '',
            })
          }
        >
          <option value="Client">Cliente</option>
          <option value="Provider">Prestador / equipe (admin)</option>
        </Select>
        {form.type === 'Client' ? (
          <Select
            label="Cliente"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : (
          <Select
            label="Prestador"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          >
            <option value="">Selecione…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700">PDF (opcional)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={
              !form.name ||
              (form.type === 'Client' ? !form.clientId : !form.employeeId) ||
              mutation.isPending
            }
            onClick={() => mutation.mutate()}
          >
            Salvar
          </Button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-700">{(mutation.error as Error).message}</p>
        )}
      </div>
    </Modal>
  )
}

export function ContractsPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.ContractsWrite)
  const [typeFilter, setTypeFilter] = useState<'all' | 'Client' | 'Provider'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<Contract | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [edit, setEdit] = useState<Contract | null>(null)

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => api.get<Contract[]>('/contracts'),
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return contracts.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (
        q &&
        !`${c.name} ${c.partyName || ''}`.toLowerCase().includes(q)
      )
        return false
      return true
    })
  }, [contracts, typeFilter, statusFilter, search])

  const statuses = [...new Set(contracts.map((c) => c.status))]

  if (isLoading) return <LoadingSpinner />


  return (
    <div>


      <div className="mona-responsive-content">
      <PageHeader
        title="Contratos"
        subtitle="Clientes e prestadores — PDF, ficha e vínculo com financeiro"
        actions={
          canWrite && (
            <Button onClick={() => setShowForm(true)}>Novo contrato</Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label="Tipo"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="min-w-[140px]"
        >
          <option value="all">Todos</option>
          <option value="Client">Clientes</option>
          <option value="Provider">Prestadores</option>
        </Select>
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[140px]"
        >
          <option value="all">Todos</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Input
          label="Buscar"
          placeholder="Nome ou parte…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px]"
        />
      </div>

      <div className={`grid gap-4 ${preview ? 'xl:grid-cols-[1fr_1.1fr]' : ''}`}>
        {filtered.length === 0 ? (
          <EmptyState title="Nenhum contrato encontrado" />
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100 bg-white">
            <table className="mona-data-table w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/80">
                <tr>
                  <th className="px-4 py-3 font-medium text-ink-900">Nome</th>
                  <th className="px-4 py-3 font-medium text-ink-900">Parte</th>
                  <th className="px-4 py-3 font-medium text-ink-900">Tipo</th>
                  <th className="px-4 py-3 font-medium text-ink-900">Status</th>
                  <th className="px-4 py-3 font-medium text-ink-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 hover:bg-ink-50/50">
                    <td data-label="Nome" className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                    <td data-label="Parte" className="px-4 py-3">
                      {c.partyPath ? (
                        <Link to={c.partyPath} className="text-brand-800 hover:underline">
                          {c.partyName || 'Abrir ficha'}
                        </Link>
                      ) : (
                        c.partyName || '—'
                      )}
                    </td>
                    <td data-label="Tipo" className="px-4 py-3">
                      {c.type === 'Client' ? 'Cliente' : 'Prestador'}
                    </td>
                    <td data-label="Status" className="px-4 py-3">{c.status}</td>
                    <td data-label="Ações" className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {c.pdfUrl && (
                          <button
                            type="button"
                            className="font-medium text-brand-800 hover:underline"
                            onClick={() => setPreview(c)}
                          >
                            PDF
                          </button>
                        )}
                        {canWrite && (
                          <button
                            type="button"
                            className="text-ink-600 hover:underline"
                            onClick={() => setEdit(c)}
                          >
                            Editar
                          </button>
                        )}
                        <Link
                          to={
                            c.clientId
                              ? `/financeiro?clientId=${c.clientId}`
                              : '/financeiro'
                          }
                          className="text-ink-600 hover:underline"
                        >
                          Financeiro
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      </div>

      {preview?.pdfUrl && (
        <PdfViewer
          url={preview.pdfUrl}
          title={preview.name}
          onClose={() => setPreview(null)}
        />
      )}

      <ContractFormModal open={showForm} onClose={() => setShowForm(false)} />
      <ContractFormModal
        open={!!edit}
        onClose={() => setEdit(null)}
        initial={edit}
      />
    </div>
  )
}
