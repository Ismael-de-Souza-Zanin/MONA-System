import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Handshake, Link2, Pencil, Target, Users } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { Client, Partner } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileAvatar,
  MobilePageHeader,
  MobileStat,
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

  const linkedClients = partners.reduce((sum, partner) => sum + (partner.clients?.length ?? 0), 0)

  return (
    <div>
      <div className="mona-phone mona-m-stack">
        <MobilePageHeader title="Parcerias" />
        <div className="mona-m-stats is-pair">
          <MobileStat icon={Users} label="Parceiras" value={partners.length} hint="cadastradas" tone="purple" />
          <MobileStat icon={Target} label="Vínculos" value={linkedClients} hint="clientes associados" tone="rose" />
        </div>
        <h2 className="mona-m-sort" style={{ justifyContent: 'flex-start' }}>Nossas parcerias</h2>
        {partners.length === 0 ? <EmptyState title="Nenhuma parceira cadastrada" /> : (
          <div className="mona-m-list" id="mona-mobile-partners-list">
            {partners.map((partner) => (
              <article key={partner.id} className="mona-m-person">
                <div className="mona-m-person__main">
                  <MobileAvatar name={partner.name} />
                  <div>
                    <strong>{partner.name}</strong>
                    <p>{partner.service || 'Serviço não informado'}</p>
                    <span className={`mona-m-badge ${(partner.clients?.length ?? 0) > 0 ? 'is-status-active' : 'is-status-hold'}`}>
                      {(partner.clients?.length ?? 0) > 0 ? `${partner.clients!.length} clientes` : 'Sem clientes'}
                    </span>
                  </div>
                </div>
                {canWrite && (
                  <div className="mona-m-person__tools">
                    <button type="button" aria-label={`Editar ${partner.name}`} onClick={() => setSelected(partner)}><Pencil size={18} /></button>
                    <button type="button" aria-label={`Vincular cliente a ${partner.name}`} onClick={() => setAssign(partner)}><Link2 size={18} /></button>
                  </div>
                )}
                {!!partner.clients?.length && (
                  <ul className="col-span-2 mt-2 space-y-2 border-t pt-2">
                    {partner.clients.map((client) => (
                      <li key={client.clientId} className="flex items-center justify-between gap-2 text-sm">
                        <Link to={`/clientes/${client.clientId}`} className="mona-m-inline min-w-0 truncate">{client.clientName || client.clientId}</Link>
                        {canWrite && <button type="button" className="mona-m-inline" onClick={() => unassign.mutate({ partnerId: partner.id, clientId: client.clientId })}>Remover</button>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
        {canWrite && (
          <button type="button" className="mona-m-banner" onClick={() => setShowAdd(true)}>
            <span className="mona-m-icon"><Handshake size={18} /></span>
            <span><strong>Nova parceria</strong><p>Indique uma empresa ou cadastre uma nova parceira.</p></span>
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <div className="mona-responsive-content mona-desk mona-management">
      <PageHeader
        title="Parcerias"
        subtitle="Empresas parceiras e clientes conectados à operação."
        actions={canWrite && <Button onClick={() => setShowAdd(true)}>Registrar parceira</Button>}
      />

      <div className="mona-management__stats">
        <MobileStat icon={Users} label="Parceiras" value={partners.length} hint="cadastradas" tone="purple" />
        <MobileStat icon={Target} label="Vínculos" value={linkedClients} hint="clientes associados" tone="rose" />
        <MobileStat icon={Handshake} label="Com clientes" value={partners.filter((partner) => (partner.clients?.length ?? 0) > 0).length} hint="parcerias em uso" tone="mint" />
      </div>

      {partners.length === 0 ? (
        <EmptyState title="Nenhuma parceira cadastrada" />
      ) : (
        <div className="mona-management__service-grid">
          {partners.map((p) => (
            <div
              key={p.id}
              className="mona-management__partner"
            >
              <button type="button" className="w-full text-left" onClick={() => setSelected(p)}>
                <p className="mona-management__service-title">{p.name}</p>
                <p className="mt-1 text-sm">{p.service || 'Serviço não informado'}</p>
              </button>
              <div className="mona-management__partner-clients">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide">
                  Clientes vinculados ({p.clients?.length ?? 0})
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
      </div>

      <PartnerFormModal key={showAdd ? 'new-open' : 'new-closed'} open={showAdd} onClose={() => setShowAdd(false)} />
      <PartnerFormModal
        key={selected?.id ?? 'none'}
        open={!!selected}
        onClose={() => setSelected(null)}
        partner={selected}
      />
      <AssignClientModal key={assign?.id ?? 'none'} open={!!assign} onClose={() => setAssign(null)} partner={assign} />
    </div>
  )
}
