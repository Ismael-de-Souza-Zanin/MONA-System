import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { ServiceItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { Briefcase, Plus } from 'lucide-react'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileChip,
  MobileChips,
  MobileHero,
  MobileRow,
  MobileTip,
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
  const [showAdd, setShowAdd] = useState(false)
  const [svcFilter, setSvcFilter] = useState<'active' | 'all' | 'running'>('active')
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

  if (isLoading) return <LoadingSpinner />

  const activeServices = services.filter((s) => s.isActive !== false)
  const mobileServices =
    svcFilter === 'active' ? activeServices : svcFilter === 'running' ? services.filter((s) => (s.clients?.length || 0) > 0) : services

  return (
    <div className="min-w-0">
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker="Serviços MONA"
          title="Soluções que transformam seu negócio"
          lead="Organize, padronize e escale seus serviços com mais controle e qualidade."
          note="Serviços organizados geram grandes resultados"
        />
        <MobileChips>
          <MobileChip active={svcFilter === 'active'} onClick={() => setSvcFilter('active')}>
            Ativos ({activeServices.length})
          </MobileChip>
          <MobileChip active={svcFilter === 'all'} onClick={() => setSvcFilter('all')}>
            Catálogo ({services.length})
          </MobileChip>
          <MobileChip active={svcFilter === 'running'} onClick={() => setSvcFilter('running')}>
            Em execução
          </MobileChip>
        </MobileChips>
        <div className="mona-m-list">
          {mobileServices.map((s) => (
            <MobileRow
              key={s.id}
              icon={<span className="mona-m-icon"><Briefcase size={16} /></span>}
              title={s.title}
              meta={s.category || s.description || 'Serviço'}
              trailing={<span className="mona-m-badge">{s.isActive === false ? 'Inativo' : 'Ativo'}</span>}
            />
          ))}
          {mobileServices.length === 0 && <EmptyState title="Nenhum serviço cadastrado" />}
          {canWrite && (
            <button type="button" className="mona-m-row" onClick={() => setShowAdd(true)}>
              <span className="mona-m-icon"><Plus size={16} /></span>
              <div className="mona-m-row__body">
                <strong>Explore nosso catálogo</strong>
                <p>Cadastre um serviço e amplie as oportunidades</p>
              </div>
            </button>
          )}
        </div>
        <MobileTip>Um serviço bem descrito vira conversa melhor no chat e no cliente.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title="Base de serviços"
        subtitle="Cadastre o que a equipe entrega, as especificidades e vincule por cliente — base para chat e comunicação."
        actions={canWrite && <Button onClick={() => setShowAdd(true)}>Adicionar serviço</Button>}
      />

      {services.length === 0 ? (
        <EmptyState title="Nenhum serviço cadastrado" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {s.category || 'Geral'}
                  </p>
                  <h3 className="font-semibold text-teal-900">{s.title}</h3>
                </div>
                {canWrite && (
                  <Button size="sm" variant="secondary" onClick={() => setAssignServiceId(s.id)}>
                    Vincular cliente
                  </Button>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-teal-700">{s.description || '—'}</p>
              {!!s.specificities?.length && (
                <ul className="mt-3 list-inside list-disc text-xs text-ink-600">
                  {s.specificities.map((sp) => (
                    <li key={sp}>{sp}</li>
                  ))}
                </ul>
              )}
              {s.assistantNotes && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  <strong>Equipe:</strong> {s.assistantNotes}
                </p>
              )}
              {s.clientFacingNotes && (
                <p className="mt-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-950">
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
