import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { Client, Partner } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

function PartnerFormModal({
  open,
  onClose,
  partner,
}: {
  open: boolean
  onClose: () => void
  partner?: Partner | null
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: partner?.name ?? '',
    responsibleName: partner?.responsibleName ?? '',
    contact: partner?.contact ?? '',
    service: partner?.service ?? '',
    notes: partner?.notes ?? '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      partner
        ? api.put(`/partners/${partner.id}`, form)
        : api.post('/partners', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['partners'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={partner ? 'Editar parceira' : 'Nova parceira'}>
      <div className="space-y-4">
        <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Responsável" value={form.responsibleName} onChange={(e) => setForm({ ...form, responsibleName: e.target.value })} />
        <Input label="Contato" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Serviço" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
        <Textarea label="Observações" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>Salvar</Button>
        </div>
      </div>
    </Modal>
  )
}

function AssignClientModal({
  open,
  onClose,
  partner,
}: {
  open: boolean
  onClose: () => void
  partner: Partner | null
}) {
  const qc = useQueryClient()
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-lite'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/partners/${partner!.id}/assign-client`, { clientId, notes, status: 'Active' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['partners'] })
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title={`Vincular cliente — ${partner?.name || ''}`}>
      <div className="space-y-3">
        <p className="text-sm text-ink-500">
          Parceira da empresa (Fatto) associada a um cliente específico.
        </p>
        <Select label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Selecione…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Textarea label="Notas do vínculo" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={!clientId || mutation.isPending} onClick={() => mutation.mutate()}>
            Vincular
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function PartnersPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.PartnersWrite)
  const qc = useQueryClient()
  const [selected, setSelected] = useState<Partner | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [assign, setAssign] = useState<Partner | null>(null)

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get<Partner[]>('/partners'),
  })

  const unassign = useMutation({
    mutationFn: ({ partnerId, clientId }: { partnerId: string; clientId: string }) =>
      api.delete(`/partners/${partnerId}/clients/${clientId}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['partners'] }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Empresas parceiras"
        subtitle="Catálogo da organização — vincule aos clientes quando fizer sentido"
        actions={canWrite && <Button onClick={() => setShowAdd(true)}>Registrar parceira</Button>}
      />

      {partners.length === 0 ? (
        <EmptyState title="Nenhuma parceira cadastrada" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-ink-100 bg-white p-4 text-left shadow-sm"
            >
              <button type="button" className="w-full text-left" onClick={() => setSelected(p)}>
                <p className="font-semibold text-ink-900">{p.name}</p>
                <p className="mt-1 text-sm text-ink-500">{p.service || '—'}</p>
              </button>
              <div className="mt-3 border-t border-ink-50 pt-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Clientes vinculados
                </p>
                {p.clients?.length ? (
                  <ul className="space-y-1 text-sm">
                    {p.clients.map((c) => (
                      <li key={c.clientId} className="flex items-center justify-between gap-2">
                        <Link to={`/clientes/${c.clientId}`} className="text-brand-800 hover:underline">
                          {c.clientName || c.clientId}
                        </Link>
                        {canWrite && (
                          <button
                            type="button"
                            className="text-xs text-red-700 hover:underline"
                            onClick={() => unassign.mutate({ partnerId: p.id, clientId: c.clientId })}
                          >
                            Remover
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-ink-400">Nenhum cliente ainda</p>
                )}
                {canWrite && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setAssign(p)}
                  >
                    Vincular cliente
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <PartnerFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <PartnerFormModal
        open={!!selected}
        onClose={() => setSelected(null)}
        partner={selected}
      />
      <AssignClientModal open={!!assign} onClose={() => setAssign(null)} partner={assign} />
    </div>
  )
}
