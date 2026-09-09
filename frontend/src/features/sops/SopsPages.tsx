import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { Client, Sop, SopRun, SopScript, SopStep } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type Hub = {
  continueRuns: {
    id: string
    sopId: string
    sopName: string
    clientName?: string
    progress: number
  }[]
  frequent: { sopId: string; name: string; procedureType?: string; category?: string; runs: number }[]
  areas: { area: string; count: number }[]
  situations: { sopId: string; label: string; sopName: string }[]
}

type Metrics = {
  periodDays: number
  activeSops: number
  totalRuns: number
  completedRuns: number
  delayedRuns: number
  inProgress: number
  top: { sopId: string; name: string; used: number; delayed: number; completionRate: number }[]
}

const SITUATION_PRESETS = [
  'Cliente não respondeu',
  'Documento está faltando',
  'Pagamento está atrasado',
  'Cliente quer cancelar',
  'Preciso iniciar um cliente',
]

export function SopsListPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.SopsWrite)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('')
  const [showLibrary, setShowLibrary] = useState(false)

  const { data: hub, isLoading: hubLoading } = useQuery({
    queryKey: ['sops-hub'],
    queryFn: () => api.get<Hub>('/sops/hub'),
  })

  const { data: metrics } = useQuery({
    queryKey: ['sops-metrics'],
    queryFn: () => api.get<Metrics>('/sops/metrics?days=30'),
    enabled: canWrite,
  })

  const q = search.trim()
  const { data: results = [], isFetching } = useQuery({
    queryKey: ['sops-search', q, area],
    queryFn: () => {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (area) params.set('category', area)
      return api.get<Sop[]>(`/sops?${params}`)
    },
    enabled: showLibrary || !!q || !!area,
  })

  if (hubLoading) return <LoadingSpinner />

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Procedimentos"
        subtitle="Chegue com um problema e saia com o próximo passo — não uma biblioteca de documentos."
        actions={
          <div className="flex flex-wrap gap-2">
            {canWrite && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/sops/nova')}>
                Nova SOP
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setShowLibrary((v) => !v)}>
              {showLibrary ? 'Voltar ao hub' : 'Biblioteca'}
            </Button>
          </div>
        }
      />

      <div className="mb-8 text-center">
        <p className="mb-3 text-sm font-medium text-ink-600">O que você precisa resolver?</p>
        <Input
          placeholder="Buscar situação, cliente ou procedimento… (ex.: cliente não pagou)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowLibrary(true)
          }}
          className="mx-auto max-w-xl text-center text-base"
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SITUATION_PRESETS.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setSearch(label)
                setShowLibrary(true)
              }}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-800 hover:text-brand-900"
            >
              {label}
            </button>
          ))}
        </div>
        {(hub?.situations?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {hub!.situations.slice(0, 6).map((s) => (
              <button
                key={`${s.sopId}-${s.label}`}
                type="button"
                onClick={() => navigate(`/sops/${s.sopId}?mode=quick`)}
                className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-900 hover:bg-brand-100"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!showLibrary && !q && (
        <div className="space-y-8">
          {(hub?.continueRuns?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
                Continue de onde parou
              </h2>
              <div className="space-y-2">
                {hub!.continueRuns.map((r) => (
                  <Link
                    key={r.id}
                    to={`/sops/${r.sopId}?run=${r.id}&mode=quick`}
                    className="flex items-center justify-between rounded-2xl border border-ink-100 bg-white px-4 py-3 transition hover:border-brand-200"
                  >
                    <div>
                      <p className="font-medium text-ink-900">{r.sopName}</p>
                      <p className="text-xs text-ink-500">{r.clientName || 'Sem cliente'}</p>
                    </div>
                    <span className="text-sm font-semibold text-brand-800">{r.progress}%</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Usados com frequência
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {(hub?.frequent ?? []).map((f) => (
                <Link
                  key={f.sopId}
                  to={`/sops/${f.sopId}?mode=quick`}
                  className="rounded-2xl border border-ink-100 bg-white px-4 py-3 transition hover:border-brand-200"
                >
                  <p className="font-medium text-ink-900">{f.name}</p>
                  <p className="text-xs text-ink-500">
                    {f.procedureType || f.category}
                    {f.runs > 0 ? ` · ${f.runs} execuções` : ''}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">
              Explorar por área
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(hub?.areas ?? []).map((a) => (
                <button
                  key={a.area}
                  type="button"
                  onClick={() => {
                    setArea(a.area)
                    setShowLibrary(true)
                  }}
                  className="rounded-2xl border border-ink-100 bg-ink-50/80 px-3 py-4 text-left transition hover:border-brand-300 hover:bg-white"
                >
                  <p className="font-semibold text-ink-900">{a.area}</p>
                  <p className="text-xs text-ink-500">{a.count} procedimentos</p>
                </button>
              ))}
            </div>
          </section>

          {canWrite && metrics && (
            <section className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 p-4">
              <h2 className="mb-2 text-sm font-semibold text-ink-800">Gestão (30 dias)</h2>
              <div className="flex flex-wrap gap-4 text-sm text-ink-700">
                <span>
                  Ativos <strong>{metrics.activeSops}</strong>
                </span>
                <span>
                  Execuções <strong>{metrics.totalRuns}</strong>
                </span>
                <span>
                  Concluídas <strong>{metrics.completedRuns}</strong>
                </span>
                <span>
                  Com atraso <strong>{metrics.delayedRuns}</strong>
                </span>
              </div>
              {metrics.top[0] && (
                <p className="mt-2 text-xs text-ink-500">
                  Mais usada: {metrics.top[0].name} ({metrics.top[0].used}× ·{' '}
                  {metrics.top[0].completionRate}% conclusão)
                </p>
              )}
            </section>
          )}
        </div>
      )}

      {(showLibrary || !!q || !!area) && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {area && (
              <span className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-900">
                Área: {area}
                <button type="button" className="ml-1" onClick={() => setArea('')}>
                  ×
                </button>
              </span>
            )}
            {isFetching && <span className="text-xs text-ink-400">Buscando…</span>}
          </div>
          {results.length === 0 ? (
            <EmptyState title="Nenhum procedimento encontrado" description="Tente outra situação ou explore por área." />
          ) : (
            <ul className="space-y-2">
              {results.map((sop) => (
                <li key={sop.id}>
                  <Link
                    to={`/sops/${sop.id}?mode=quick`}
                    className="block rounded-2xl border border-ink-100 bg-white px-4 py-3 transition hover:border-brand-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink-900">{sop.name}</p>
                        <p className="text-xs text-brand-800">
                          {sop.procedureType || sop.category}
                          {sop.triggerDescription ? ` · ${sop.triggerDescription}` : ''}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-ink-600">
                          {sop.usageDescription || sop.outcome || '—'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-ink-400">
                        {sop.stepCount ?? sop.steps?.length ?? 0} passos
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function SopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'full' ? 'full' : 'quick'
  const resumeRunId = params.get('run') || ''
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.SopsWrite)
  const qc = useQueryClient()
  const [scriptType, setScriptType] = useState('')
  const [scriptContent, setScriptContent] = useState('')
  const [run, setRun] = useState<SopRun | null>(null)
  const [clientId, setClientId] = useState('')
  const [overlayKind, setOverlayKind] = useState('Rule')
  const [overlayTitle, setOverlayTitle] = useState('')
  const [overlayBody, setOverlayBody] = useState('')
  const [overlayClientId, setOverlayClientId] = useState('')

  const { data: sop, isLoading } = useQuery({
    queryKey: ['sop', id, clientId],
    queryFn: () =>
      api.get<Sop>(`/sops/${id}${clientId ? `?clientId=${clientId}` : ''}`),
    enabled: !!id && id !== 'nova',
  })

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-min'],
    queryFn: () => api.get<Client[]>('/clients'),
  })

  useEffect(() => {
    if (!resumeRunId) return
    void api.get<SopRun>(`/sops/runs/${resumeRunId}`).then(setRun).catch(() => undefined)
  }, [resumeRunId])

  const addScriptMutation = useMutation({
    mutationFn: () =>
      api.post(`/sops/${id}/scripts`, { type: scriptType, content: scriptContent }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sop', id] })
      setScriptType('')
      setScriptContent('')
    },
  })

  const addOverlayMutation = useMutation({
    mutationFn: () =>
      api.post(`/sops/${id}/overlays`, {
        kind: overlayKind,
        title: overlayTitle,
        body: overlayBody,
        clientId: overlayClientId || null,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sop', id] })
      setOverlayTitle('')
      setOverlayBody('')
    },
  })

  const startRunMutation = useMutation({
    mutationFn: () => api.post<SopRun>(`/sops/${id}/runs`, { clientId: clientId || null }),
    onSuccess: (data) => {
      setRun(data)
      void qc.invalidateQueries({ queryKey: ['sops-hub'] })
    },
  })

  const toggleStepMutation = useMutation({
    mutationFn: ({ stepId, isCompleted }: { stepId: string; isCompleted: boolean }) =>
      api.patch<SopRun>(`/sops/runs/${run!.id}/steps/${stepId}`, { isCompleted }),
    onSuccess: (data) => setRun(data),
  })

  const completeRunMutation = useMutation({
    mutationFn: () => api.post<SopRun>(`/sops/runs/${run!.id}/complete`),
    onSuccess: (data) => {
      setRun(data)
      void qc.invalidateQueries({ queryKey: ['sops-hub', 'sops-metrics'] })
    },
  })

  const markDelayedMutation = useMutation({
    mutationFn: () => api.patch<SopRun>(`/sops/runs/${run!.id}`, { wasDelayed: true }),
    onSuccess: (data) => setRun(data),
  })

  if (isLoading) return <LoadingSpinner />
  if (!sop) return <EmptyState title="Procedimento não encontrado" />

  const steps = sop.steps || []
  const currentIdx =
    run?.steps.findIndex((s) => !s.isCompleted) ?? (run ? run.steps.length : -1)
  const currentStep = run && currentIdx >= 0 ? run.steps[currentIdx] : null

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={sop.name}
        subtitle={`${sop.procedureType || sop.category || 'Geral'} · v${sop.version ?? 1}${
          sop.estimatedMinutes ? ` · ~${sop.estimatedMinutes} min` : ''
        }${sop.slaBusinessDays ? ` · SLA ${sop.slaBusinessDays}d` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/sops')}>
              ← Hub
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                navigate(`/sops/${id}?mode=${mode === 'quick' ? 'full' : 'quick'}${run ? `&run=${run.id}` : ''}`)
              }
            >
              Modo {mode === 'quick' ? 'completo' : 'rápido'}
            </Button>
            {canWrite && (
              <Button size="sm" onClick={() => navigate(`/sops/${id}/editar`)}>
                Editar
              </Button>
            )}
          </div>
        }
      />

      {mode === 'quick' ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card className="border-l-4 border-l-brand-800">
            {!run ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                  Procedimento recomendado
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink-900">{sop.name}</h2>
                <p className="mt-2 text-sm text-ink-600">
                  {sop.triggerDescription || sop.usageDescription || sop.outcome}
                </p>
                <div className="mt-4 space-y-3">
                  <Select
                    label="Cliente (opcional)"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">— Sem cliente —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    className="w-full"
                    disabled={!steps.length || startRunMutation.isPending}
                    onClick={() => startRunMutation.mutate()}
                  >
                    Iniciar procedimento
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-brand-800">
                    {run.status === 'InProgress'
                      ? `Passo ${(currentIdx < 0 ? run.steps.length : currentIdx) + 1} de ${run.steps.length}`
                      : 'Concluído'}
                  </p>
                  <span className="text-sm font-semibold text-brand-800">{run.progress}%</span>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full bg-brand-800 transition-all" style={{ width: `${run.progress}%` }} />
                </div>

                <ol className="mb-4 space-y-1">
                  {run.steps.map((s, i) => (
                    <li
                      key={s.id}
                      className={`text-sm ${
                        s.isCompleted
                          ? 'text-ink-400 line-through'
                          : i === currentIdx
                            ? 'font-semibold text-ink-900'
                            : 'text-ink-500'
                      }`}
                    >
                      {s.isCompleted ? '✓ ' : `${i + 1}  `}
                      {s.title}
                    </li>
                  ))}
                </ol>

                {currentStep && run.status === 'InProgress' && (
                  <div className="rounded-2xl bg-ink-50 p-4">
                    <p className="text-lg font-semibold text-ink-900">Próximo passo</p>
                    <p className="mt-1 font-medium text-ink-800">{currentStep.title}</p>
                    {currentStep.instruction && (
                      <p className="mt-2 text-sm text-ink-600">{currentStep.instruction}</p>
                    )}
                    {currentStep.actionPath && (
                      <Link
                        to={currentStep.actionPath}
                        className="mt-3 inline-flex rounded-xl bg-brand-800 px-3 py-2 text-sm font-semibold text-white"
                      >
                        {currentStep.actionLabel || 'Abrir'}
                      </Link>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          toggleStepMutation.mutate({ stepId: currentStep.id, isCompleted: true })
                        }
                      >
                        Marcar feito
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => markDelayedMutation.mutate()}
                        disabled={run.wasDelayed}
                      >
                        {run.wasDelayed ? 'Atraso registrado' : 'Registrar atraso'}
                      </Button>
                    </div>
                  </div>
                )}

                {run.status === 'InProgress' && (
                  <Button
                    className="mt-4 w-full"
                    variant="secondary"
                    onClick={() => completeRunMutation.mutate()}
                  >
                    Finalizar execução
                  </Button>
                )}
                {run.status === 'Completed' && (
                  <p className="mt-3 text-center text-sm font-medium text-brand-800">
                    Execução concluída
                    {run.wasDelayed ? ' · com atraso registrado' : ''}
                  </p>
                )}
              </>
            )}
          </Card>

          <div className="space-y-3">
            {(sop.overlays?.length ?? 0) > 0 && (
              <Card>
                <p className="text-xs font-semibold uppercase text-ink-500">Regras aplicáveis</p>
                <ul className="mt-2 space-y-2">
                  {sop.overlays!.map((o) => (
                    <li key={o.id} className="rounded-lg bg-amber-50 px-2 py-2 text-xs text-amber-950">
                      <strong>
                        {o.kind}
                        {o.clientName ? ` · ${o.clientName}` : ''}:
                      </strong>{' '}
                      {o.title} — {o.body}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {sop.scripts?.[0] && (
              <Card>
                <p className="text-xs font-semibold uppercase text-ink-500">Script</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{sop.scripts[0].content}</p>
                <Button
                  size="sm"
                  className="mt-2"
                  variant="secondary"
                  onClick={() => void navigator.clipboard.writeText(sop.scripts[0].content)}
                >
                  Copiar
                </Button>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {sop.outcome && (
              <Card className="border-l-4 border-l-brand-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                  Resultado esperado
                </p>
                <p className="mt-1 text-sm text-ink-800">{sop.outcome}</p>
              </Card>
            )}
            <Card>
              <h2 className="mb-2 font-semibold text-ink-900">Quando usar / gatilho</h2>
              <p className="text-sm text-ink-700">
                {sop.triggerDescription || sop.usageDescription || '—'}
              </p>
              {!!sop.situationAliases?.length && (
                <p className="mt-2 text-xs text-ink-500">
                  Situações: {sop.situationAliases.join(' · ')}
                </p>
              )}
            </Card>
            {sop.procedure && (
              <Card>
                <h2 className="mb-2 font-semibold text-ink-900">Procedimento</h2>
                <p className="whitespace-pre-wrap text-sm text-ink-700">{sop.procedure}</p>
              </Card>
            )}
            {sop.rules && (
              <Card>
                <h2 className="mb-2 font-semibold text-ink-900">Regras base</h2>
                <p className="whitespace-pre-wrap text-sm text-ink-700">{sop.rules}</p>
              </Card>
            )}
            {(sop.overlays?.length ?? 0) > 0 && (
              <Card>
                <h2 className="mb-2 font-semibold text-ink-900">Overlays (empresa / cliente)</h2>
                <ul className="space-y-2">
                  {sop.overlays!.map((o) => (
                    <li key={o.id} className="rounded-xl border border-ink-100 px-3 py-2 text-sm">
                      <span className="text-xs font-semibold uppercase text-brand-800">{o.kind}</span>
                      {o.clientName && <span className="text-xs text-ink-500"> · {o.clientName}</span>}
                      <p className="font-medium">{o.title}</p>
                      <p className="text-ink-600">{o.body}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card>
              <h2 className="mb-3 font-semibold text-ink-900">Fluxo completo</h2>
              <ol className="space-y-3">
                {steps.map((step, idx) => (
                  <li key={step.id || idx} className="rounded-xl border border-ink-100 px-3 py-3">
                    <p className="font-medium text-ink-900">
                      {idx + 1}. {step.title}
                      {step.isCritical && (
                        <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                          crítico
                        </span>
                      )}
                    </p>
                    {step.instruction && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-600">{step.instruction}</p>
                    )}
                    {step.actionPath && (
                      <Link to={step.actionPath} className="mt-1 inline-block text-xs text-brand-800 underline">
                        {step.actionLabel || step.actionPath}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
            <div>
              <h2 className="mb-3 text-lg font-semibold text-ink-900">Scripts</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {sop.scripts?.map((script: SopScript) => (
                  <Card key={script.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">
                      {script.title || script.type}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800">{script.content}</p>
                  </Card>
                ))}
              </div>
            </div>
            {canWrite && (
              <>
                <Card>
                  <h3 className="mb-3 font-medium text-ink-900">Adicionar script</h3>
                  <div className="space-y-3">
                    <Input label="Tipo / título" value={scriptType} onChange={(e) => setScriptType(e.target.value)} />
                    <Textarea
                      label="Conteúdo"
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                    />
                    <Button
                      disabled={!scriptType || !scriptContent}
                      onClick={() => addScriptMutation.mutate()}
                    >
                      Adicionar
                    </Button>
                  </div>
                </Card>
                <Card>
                  <h3 className="mb-3 font-medium text-ink-900">Overlay (sem duplicar SOP)</h3>
                  <div className="space-y-3">
                    <Select label="Tipo" value={overlayKind} onChange={(e) => setOverlayKind(e.target.value)}>
                      <option value="Rule">Regra da empresa</option>
                      <option value="Channel">Canal preferido</option>
                      <option value="Condition">Condição</option>
                      <option value="Exception">Exceção</option>
                    </Select>
                    <Select
                      label="Cliente (vazio = empresa)"
                      value={overlayClientId}
                      onChange={(e) => setOverlayClientId(e.target.value)}
                    >
                      <option value="">Toda a operação</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Título"
                      value={overlayTitle}
                      onChange={(e) => setOverlayTitle(e.target.value)}
                    />
                    <Textarea
                      label="Texto"
                      value={overlayBody}
                      onChange={(e) => setOverlayBody(e.target.value)}
                      placeholder="Ex.: Cobrar primeiro por WhatsApp"
                    />
                    <Button
                      disabled={!overlayBody || addOverlayMutation.isPending}
                      onClick={() => addOverlayMutation.mutate()}
                    >
                      Salvar overlay
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <h2 className="font-semibold text-ink-900">Executar</h2>
              <Select
                className="mt-3"
                label="Cliente"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">— Sem cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Button
                className="mt-3 w-full"
                disabled={!steps.length}
                onClick={() => startRunMutation.mutate()}
              >
                Iniciar execução
              </Button>
            </Card>
            {run && (
              <Card>
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-ink-900">Execução</p>
                  <span className="text-xs font-medium text-brand-800">{run.progress}%</span>
                </div>
                <ul className="space-y-2">
                  {run.steps.map((s) => (
                    <li key={s.id} className="rounded-lg bg-ink-50 px-2 py-2">
                      <Checkbox
                        label={`${s.title}${s.isCritical ? ' ★' : ''}`}
                        checked={s.isCompleted}
                        disabled={run.status !== 'InProgress'}
                        onChange={(e) =>
                          toggleStepMutation.mutate({ stepId: s.id, isCompleted: e.target.checked })
                        }
                      />
                    </li>
                  ))}
                </ul>
                {run.status === 'InProgress' && (
                  <Button className="mt-3 w-full" variant="secondary" onClick={() => completeRunMutation.mutate()}>
                    Finalizar
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function SopFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id && id !== 'nova'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['sop', id],
    queryFn: () => api.get<Sop>(`/sops/${id}`),
    enabled: !!isEdit,
  })

  const [form, setForm] = useState({
    name: '',
    usageDescription: '',
    procedure: '',
    rules: '',
    category: 'Atendimento',
    procedureType: 'Geral',
    triggerDescription: '',
    situationAliases: '',
    outcome: '',
    estimatedMinutes: '',
    slaBusinessDays: '',
    bumpVersion: false,
  })
  const [steps, setSteps] = useState<SopStep[]>([
    { sortOrder: 1, title: '', instruction: '', isCritical: false, actionKind: 'none' },
  ])

  useEffect(() => {
    if (!existing) return
    setForm({
      name: existing.name,
      usageDescription: existing.usageDescription || '',
      procedure: existing.procedure || '',
      rules: existing.rules || '',
      category: existing.category || 'Atendimento',
      procedureType: existing.procedureType || 'Geral',
      triggerDescription: existing.triggerDescription || '',
      situationAliases: (existing.situationAliases || []).join('\n'),
      outcome: existing.outcome || '',
      estimatedMinutes: existing.estimatedMinutes?.toString() || '',
      slaBusinessDays: existing.slaBusinessDays?.toString() || '',
      bumpVersion: false,
    })
    if (existing.steps?.length) {
      setSteps(
        existing.steps.map((s, i) => ({
          sortOrder: s.sortOrder || i + 1,
          title: s.title,
          instruction: s.instruction || '',
          isCritical: !!s.isCritical,
          estimatedMinutes: s.estimatedMinutes,
          actionKind: s.actionKind || 'none',
          actionPath: s.actionPath,
          actionLabel: s.actionLabel,
        })),
      )
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        usageDescription: form.usageDescription,
        procedure: form.procedure,
        rules: form.rules,
        category: form.category,
        procedureType: form.procedureType,
        applicableArea: form.category,
        triggerDescription: form.triggerDescription,
        situationAliases: form.situationAliases
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        outcome: form.outcome || null,
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
        slaBusinessDays: form.slaBusinessDays ? Number(form.slaBusinessDays) : null,
        bumpVersion: form.bumpVersion,
        steps: steps
          .filter((s) => s.title.trim())
          .map((s, i) => ({
            title: s.title,
            instruction: s.instruction,
            isCritical: s.isCritical,
            estimatedMinutes: s.estimatedMinutes || null,
            sortOrder: i + 1,
            actionKind: s.actionKind || 'none',
            actionPath: s.actionPath || null,
            actionLabel: s.actionLabel || null,
          })),
      }
      return isEdit ? api.put<Sop>(`/sops/${id}`, payload) : api.post<Sop>('/sops', payload)
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['sops'] })
      void qc.invalidateQueries({ queryKey: ['sops-hub'] })
      navigate(isEdit ? `/sops/${id}?mode=full` : `/sops/${data.id}?mode=quick`)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar procedimento' : 'Novo procedimento'} />
      <div className="grid max-w-4xl gap-4">
        <Card>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input
              label="Tipo (Cobrança, Onboarding…)"
              value={form.procedureType}
              onChange={(e) => setForm({ ...form, procedureType: e.target.value })}
            />
            <Input
              label="Área"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Input
              label="Gatilho (situação)"
              value={form.triggerDescription}
              onChange={(e) => setForm({ ...form, triggerDescription: e.target.value })}
            />
            <Input
              label="Tempo estimado (min)"
              type="number"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })}
            />
            <Input
              label="SLA (dias úteis)"
              type="number"
              value={form.slaBusinessDays}
              onChange={(e) => setForm({ ...form, slaBusinessDays: e.target.value })}
            />
            {isEdit && (
              <label className="flex items-center gap-2 self-end text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={form.bumpVersion}
                  onChange={(e) => setForm({ ...form, bumpVersion: e.target.checked })}
                />
                Subir versão
              </label>
            )}
            <div className="sm:col-span-2">
              <Input
                label="Resultado esperado"
                value={form.outcome}
                onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Aliases de situação (uma por linha) — ex.: cliente não pagou"
                value={form.situationAliases}
                onChange={(e) => setForm({ ...form, situationAliases: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Quando usar"
                value={form.usageDescription}
                onChange={(e) => setForm({ ...form, usageDescription: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Procedimento / contexto"
                value={form.procedure}
                onChange={(e) => setForm({ ...form, procedure: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Textarea
                label="Regras base"
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">Passos</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setSteps([
                  ...steps,
                  { sortOrder: steps.length + 1, title: '', instruction: '', isCritical: false, actionKind: 'none' },
                ])
              }
            >
              + Passo
            </Button>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="rounded-xl border border-ink-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-500">Passo {index + 1}</p>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => setSteps(steps.filter((_, i) => i !== index))}
                  >
                    Remover
                  </button>
                </div>
                <div className="grid gap-2">
                  <Input
                    label="Título"
                    value={step.title}
                    onChange={(e) => {
                      const next = [...steps]
                      next[index] = { ...step, title: e.target.value }
                      setSteps(next)
                    }}
                  />
                  <Textarea
                    label="Instrução"
                    value={step.instruction || ''}
                    onChange={(e) => {
                      const next = [...steps]
                      next[index] = { ...step, instruction: e.target.value }
                      setSteps(next)
                    }}
                  />
                  <Input
                    label="Ação — rota (ex.: /financeiro)"
                    value={step.actionPath || ''}
                    onChange={(e) => {
                      const next = [...steps]
                      next[index] = {
                        ...step,
                        actionPath: e.target.value,
                        actionKind: e.target.value ? 'open_path' : 'none',
                      }
                      setSteps(next)
                    }}
                  />
                  <Input
                    label="Rótulo do botão"
                    value={step.actionLabel || ''}
                    onChange={(e) => {
                      const next = [...steps]
                      next[index] = { ...step, actionLabel: e.target.value }
                      setSteps(next)
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!step.isCritical}
                      onChange={(e) => {
                        const next = [...steps]
                        next[index] = { ...step, isCritical: e.target.checked }
                        setSteps(next)
                      }}
                    />
                    Passo crítico
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  )
}
