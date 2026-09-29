import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ChevronRight, Gift } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { ServiceItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileChip,
  MobileChips,
  MobilePageHeader,
  MobileStat,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type ServiceRow = ServiceItem & {
  category?: string
  specificities?: string[]
  assistantNotes?: string
  clientFacingNotes?: string
  isActive?: boolean
  clients?: { clientId: string; clientName?: string; status: string; customNotes?: string }[]
}

export function ServicesPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.ServicesWrite)
  const [svcFilter, setSvcFilter] = useState<'active' | 'all' | 'running'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [assignServiceId, setAssignServiceId] = useState<string | null>(null)
  const [assignClientId, setAssignClientId] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Geral',
    specificities: '',
    assistantNotes: '',
    clientFacingNotes: '',
  })
  const qc = useQueryClient()

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<ServiceRow[]>('/services'),
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
    enabled: !!assignServiceId,
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/services', {
        title: form.title,
        description: form.description,
        category: form.category,
        specificities: form.specificities
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        assistantNotes: form.assistantNotes,
        clientFacingNotes: form.clientFacingNotes,
        isActive: true,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
      setShowAdd(false)
      setForm({
        title: '',
        description: '',
        category: 'Geral',
        specificities: '',
        assistantNotes: '',
        clientFacingNotes: '',
      })
    },
  })

  const assignMutation = useMutation({
    mutationFn: () =>
      api.post(`/services/${assignServiceId}/assign-client`, {
        clientId: assignClientId,
        status: 'Active',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['services'] })
      setAssignServiceId(null)
      setAssignClientId('')
    },
  })

  const filteredServices = services.filter((service) => svcFilter === 'all' || (svcFilter === 'active' ? service.isActive !== false : service.clients?.some((client) => client.status === 'Active')))
  if (isLoading) return <LoadingSpinner />


  const activeCount = services.filter((service) => service.isActive !== false).length
  const runningCount = services.filter((service) => service.clients?.some((client) => client.status === 'Active')).length

  return (
    <div className="min-w-0">
      <div className="mona-phone mona-m-stack">
        <MobilePageHeader title="Serviços" />
        <MobileChips>
          <MobileChip active={svcFilter === 'active'} tone="mint" onClick={() => setSvcFilter('active')}>Ativos ({activeCount})</MobileChip>
          <MobileChip active={svcFilter === 'all'} tone="purple" onClick={() => setSvcFilter('all')}>Catálogo ({services.length})</MobileChip>
          <MobileChip active={svcFilter === 'running'} tone="orange" onClick={() => setSvcFilter('running')}>Em execução ({runningCount})</MobileChip>
        </MobileChips>
        {filteredServices.length === 0 ? <EmptyState title="Nenhum serviço neste filtro" /> : (
          <div className="mona-m-list">
            {filteredServices.map((service) => {
              const running = service.clients?.some((client) => client.status === 'Active')
              const clientCount = service.clients?.length ?? 0
              return (
                <article key={service.id} className="mona-m-person">
                  <div className="mona-m-person__main">
                    <span className="mona-m-icon"><Briefcase size={18} /></span>
                    <div>
                      <strong>{service.title}</strong>
                      <p>{service.description || service.category || 'Serviço'}</p>
                      <span className="mona-m-badge">{service.category || 'Geral'}</span>
                      <span className={`mona-m-badge ${running ? 'is-status-hold' : service.isActive === false ? 'is-status-inactive' : 'is-status-active'}`}>
                        {running ? 'Em execução' : service.isActive === false ? 'Inativo' : 'Ativo'}
                      </span>
                      <p>{clientCount} {clientCount === 1 ? 'cliente' : 'clientes'}</p>
                    </div>
                  </div>
                  {canWrite && (
                    <button type="button" className="mona-m-inline" onClick={() => setAssignServiceId(service.id)}>Vincular</button>
                  )}
                </article>
              )
            })}
          </div>
        )}
        <button type="button" className="mona-m-banner" onClick={() => canWrite ? setShowAdd(true) : setSvcFilter('all')}>
          <span className="mona-m-icon"><Gift size={18} /></span>
          <span><strong>Explore nosso catálogo</strong><p>{canWrite ? 'Cadastre um serviço e amplie as oportunidades.' : 'Veja todos os serviços cadastrados e amplie as entregas.'}</p></span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mona-responsive-content mona-desk mona-management">
      <PageHeader
        title="Serviços"
        subtitle="Catálogo de entregas e vínculos com clientes."
        actions={canWrite && <Button onClick={() => setShowAdd(true)}>Adicionar serviço</Button>}
      />

      <div className="mona-management__stats">
        <MobileStat icon={Briefcase} label="No catálogo" value={services.length} hint="serviços cadastrados" tone="purple" />
        <MobileStat icon={Briefcase} label="Ativos" value={activeCount} hint="disponíveis para entrega" tone="mint" />
        <MobileStat icon={Briefcase} label="Em execução" value={runningCount} hint="com clientes ativos" tone="orange" />
      </div>

      <div className="mona-management__toolbar"><Select label="Filtrar serviços" value={svcFilter} onChange={(event) => setSvcFilter(event.target.value as typeof svcFilter)}><option value="all">Todos os serviços</option><option value="active">Ativos</option><option value="running">Em execução</option></Select></div>
      {filteredServices.length === 0 ? (
        <EmptyState title="Nenhum serviço cadastrado" />
      ) : (
        <div className="mona-management__service-grid">
          {filteredServices.map((s) => (
            <Card key={s.id} className="mona-management__service">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {s.category || 'Geral'}
                  </p>
                  <h3 className="mona-management__service-title">{s.title}</h3>
                </div>
                {canWrite && (
                  <Button size="sm" variant="secondary" onClick={() => setAssignServiceId(s.id)}>
                    Vincular cliente
                  </Button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{s.description || '—'}</p>
              {!!s.specificities?.length && (
                <ul className="mt-3 list-inside list-disc text-xs text-ink-600">
                  {s.specificities.map((sp) => (
                    <li key={sp}>{sp}</li>
                  ))}
                </ul>
              )}
              {s.assistantNotes && (
                <p className="mona-management__note is-internal">
                  <strong>Equipe:</strong> {s.assistantNotes}
                </p>
              )}
              {s.clientFacingNotes && (
                <p className="mona-management__note is-client">
                  <strong>Cliente:</strong> {s.clientFacingNotes}
                </p>
              )}
              {!!s.clients?.length && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.clients.map((c) => (
                    <Link
                      key={c.clientId}
                      to={`/clientes/${c.clientId}`}
                      className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-900 hover:underline"
                    >
                      {c.clientName || c.clientId}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novo serviço" size="lg">
        <div className="space-y-4">
          <Input label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select
            label="Categoria"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="Geral">Geral</option>
            <option value="Atendimento">Atendimento</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Documentos">Documentos</option>
            <option value="Comercial">Comercial</option>
          </Select>
          <Textarea
            label="Descrição"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Textarea
            label="Especificidades (uma por linha)"
            value={form.specificities}
            onChange={(e) => setForm({ ...form, specificities: e.target.value })}
            placeholder="Ex.: Responder em inglês&#10;Enviar relatório semanal"
          />
          <Textarea
            label="Notas para assistentes (interno)"
            value={form.assistantNotes}
            onChange={(e) => setForm({ ...form, assistantNotes: e.target.value })}
          />
          <Textarea
            label="Texto para o cliente / comunicação"
            value={form.clientFacingNotes}
            onChange={(e) => setForm({ ...form, clientFacingNotes: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancelar
            </Button>
            <Button disabled={!form.title || mutation.isPending} onClick={() => mutation.mutate()}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!assignServiceId} onClose={() => setAssignServiceId(null)} title="Vincular serviço ao cliente">
        <div className="space-y-4">
          <Select
            label="Cliente"
            value={assignClientId}
            onChange={(e) => setAssignClientId(e.target.value)}
          >
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAssignServiceId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!assignClientId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              Vincular
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
