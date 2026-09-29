import { useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, CheckSquare, Clock3, FileCheck2, Users, Wallet } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  Checkbox,
  ErrorAlert,
  Input,
  LoadingSpinner,
  MobilePageHeader,
  MobileStat,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type Lens = 'adm' | 'va' | 'client'
type Period = 'day' | 'week' | 'month'

interface MoneySlice {
  paid: number
  pending: number
}

interface Report {
  lens: Lens
  period: Period
  from: string
  to: string
  todos: { done: number; open: number; overdue: number }
  agenda: { meetings: number; events: number }
  decisions: { total: number; open: number }
  sops: { completedRuns: number }
  time: { minutes: number; hours: number; retainerHours: number; retainerUsedHours: number }
  money?: {
    agency?: MoneySlice
    clientAr?: MoneySlice
    clientAp?: MoneySlice
    payout?: MoneySlice
    marginPaid?: number
  }
  byClient: { clientId: string; name: string; retainerHours: number; todosDone: number; minutes: number }[]
  evidence: {
    todos: { id: string; title: string; clientName?: string }[]
    decisions: { id: string; title: string; isOpen: boolean; visibleToClient: boolean; clientName?: string }[]
  }
}

function money(v?: number) {
  return (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ReportsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const qc = useQueryClient()
  const canAdm = !!user?.isOwner || hasPermission(Permissions.FinanceAll)
  const canTime = hasPermission(Permissions.TodosWrite)
  const canDecision = hasPermission(Permissions.AgendaWrite)
  const canClientWrite = hasPermission(Permissions.ClientsWrite)
  const [lens, setLens] = useState<Lens>(canAdm ? 'adm' : 'va')
  const [period, setPeriod] = useState<Period>('week')
  const [clientId, setClientId] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('30')
  const [timeNote, setTimeNote] = useState('')
  const [decTitle, setDecTitle] = useState('')
  const [decVisible, setDecVisible] = useState(false)
  const [decTodo, setDecTodo] = useState(true)
  const [pointName, setPointName] = useState('')
  const [pointChannel, setPointChannel] = useState('WhatsApp')
  const [retainerHours, setRetainerHours] = useState('')

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/clients'),
  })

  const reportQuery = useMemo(() => {
    const p = new URLSearchParams({ lens, period })
    if (clientId) p.set('clientId', clientId)
    return `/reports?${p.toString()}`
  }, [lens, period, clientId])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['ops-report', lens, period, clientId],
    queryFn: () => api.get<Report>(reportQuery),
    enabled: lens !== 'client' || !!clientId,
  })

  const timeMut = useMutation({
    mutationFn: () =>
      api.post('/time-entries', {
        minutes: Number(timeMinutes),
        clientId: clientId || null,
        note: timeNote || null,
      }),
    onSuccess: () => {
      setTimeNote('')
      void qc.invalidateQueries({ queryKey: ['ops-report'] })
    },
  })

  const decMut = useMutation({
    mutationFn: () =>
      api.post('/decisions', {
        title: decTitle,
        clientId: clientId || null,
        visibleToClient: decVisible,
        createTodo: canTime && decTodo,
      }),
    onSuccess: () => {
      setDecTitle('')
      void qc.invalidateQueries({ queryKey: ['ops-report'] })
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['operations-queue'] })
    },
  })

  const pointMut = useMutation({
    mutationFn: () =>
      api.post('/attendance-points', {
        clientId,
        name: pointName,
        channel: pointChannel,
      }),
    onSuccess: () => {
      setPointName('')
      void qc.invalidateQueries({ queryKey: ['attendance-points'] })
    },
  })

  const retainerMut = useMutation({
    mutationFn: () => api.patch(`/clients/${clientId}/retainer`, { hoursPerMonth: Number(retainerHours) }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['ops-report'] }),
  })

  const { data: points = [] } = useQuery({
    queryKey: ['attendance-points', clientId],
    queryFn: () =>
      api.get<{ id: string; name: string; channel: string; slaMinutes?: number }[]>(
        `/attendance-points${clientId ? `?clientId=${clientId}` : ''}`,
      ),
    enabled: hasPermission(Permissions.ClientsRead),
  })

  if (lens === 'client' && !clientId) {
    return (
      <div>
        <div className="mona-phone mona-m-stack">
          <MobilePageHeader title="Relatórios" />
          <Select aria-label="Olhar do relatório" value={lens} onChange={(e) => setLens(e.target.value as Lens)}>
            {canAdm && <option value="adm">ADM / casa</option>}
            <option value="va">Minha VA</option>
            <option value="client">Cliente</option>
          </Select>
          <Select aria-label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Escolha o cliente</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div className="mona-desk">
          <PageHeader title="Relatórios operacionais" subtitle="Escolha o cliente para ver o que ele pode validar." />
          <Button variant="ghost" onClick={() => setLens(canAdm ? 'adm' : 'va')}>
            Voltar ao meu relatório
          </Button>
          <Select label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">— escolha —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <PageHeader title="Relatórios operacionais" subtitle="Não foi possível carregar o relatório." />
        <ErrorAlert message={error.message} />
        <Button onClick={() => void refetch()}>Tentar novamente</Button>
        {clientId && (
          <Button variant="ghost" onClick={() => setClientId('')}>
            Limpar cliente
          </Button>
        )}
      </div>
    )
  }
  if (isLoading) return <LoadingSpinner />
  if (!data || Array.isArray(data) || !data.todos) {
    return <ErrorAlert message="O relatório retornou dados incompletos. Tente recarregar a página." />
  }

  const subtitle =
    lens === 'adm'
      ? 'Desempenho do time, gavetas B/C e margem — o cliente não vê isto.'
      : lens === 'va'
        ? 'Sua fila, suas horas e o seu repasse.'
        : 'O que este cliente pode validar: entregas e decisões visíveis.'


  const taskTotal = data.todos.done + data.todos.open
  const donePct = taskTotal ? Math.round((data.todos.done / taskTotal) * 100) : 0
  const overduePct = data.todos.open ? Math.round((data.todos.overdue / data.todos.open) * 100) : 0
  const retainerPct = data.time.retainerHours
    ? Math.min(100, Math.round((data.time.retainerUsedHours / data.time.retainerHours) * 100))
    : 0
  const decisionOpenPct = data.decisions.total ? Math.round((data.decisions.open / data.decisions.total) * 100) : 0
  const moneyPending =
    (data.money?.agency?.pending ?? 0) +
    (data.money?.clientAr?.pending ?? 0) +
    (data.money?.clientAp?.pending ?? 0) +
    (data.money?.payout?.pending ?? 0)
  const maxClientTodos = Math.max(1, ...data.byClient.map((client) => client.todosDone))

  return (
    <div>
      <div className="mona-phone mona-m-stack">
        <MobilePageHeader title="Relatórios" />
        <div className="mona-m-segment">
          <button type="button" className={period === 'day' ? 'is-active' : ''} onClick={() => setPeriod('day')}>Hoje</button>
          <button type="button" className={period === 'week' ? 'is-active' : ''} onClick={() => setPeriod('week')}>Semana</button>
          <button type="button" className={period === 'month' ? 'is-active' : ''} onClick={() => setPeriod('month')}>Mês</button>
        </div>
        <Select aria-label="Olhar do relatório" value={lens} onChange={(e) => setLens(e.target.value as Lens)}>
          {canAdm && <option value="adm">ADM / casa</option>}
          <option value="va">Minha VA</option>
          <option value="client">Cliente</option>
        </Select>
        {lens === 'client' && (
          <Select aria-label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Escolha o cliente</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <div className="mona-m-stats is-pair">
          <MobileStat icon={CheckSquare} label="Produtividade" value={`${donePct}%`} hint={`${data.todos.done} de ${taskTotal} tarefas`} tone="purple" />
          <MobileStat icon={CheckSquare} label="Tarefas concluídas" value={data.todos.done} hint={`${data.todos.open} abertas · ${data.todos.overdue} atrasadas`} tone="mint" />
        </div>
        <div className="mona-m-stats is-pair">
          <MobileStat icon={Users} label="Clientes no período" value={data.byClient.length} hint={`${data.agenda.meetings} reuniões`} tone="orange" />
          <MobileStat icon={Clock3} label="Horas registradas" value={data.time.hours} hint={`Pacote ${data.time.retainerHours}h · usado ${data.time.retainerUsedHours}h`} tone="rose" />
        </div>
        <section className="mona-m-panel">
          <div className="mona-m-section__head"><h2>Saúde operacional</h2><span>{period === 'day' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}</span></div>
          <div className="mona-m-kpis">
            <div><span>Atrasos</span><strong>{data.todos.overdue}</strong><em>{overduePct}% do aberto</em></div>
            <div><span>Decisões abertas</span><strong>{data.decisions.open}</strong><em>{decisionOpenPct}% do total</em></div>
            <div><span>SOPs concluídos</span><strong>{data.sops.completedRuns}</strong><em>rotinas fechadas</em></div>
            <div><span>Financeiro pendente</span><strong>{money(moneyPending)}</strong><em>no período</em></div>
          </div>
          <div className="mona-m-progress">
            <span><strong>Uso do pacote</strong><em>{retainerPct}%</em></span>
            <i><b style={{ width: `${retainerPct}%` }} /></i>
          </div>
        </section>
        <section className="mona-m-panel">
          <div className="mona-m-section__head"><h2>Tarefas concluídas</h2></div>
          <p className="mona-m-sort">Por cliente neste período</p>
          <div className="mona-m-mini">
            {data.byClient.length === 0 && <p>Nenhum cliente com movimento neste recorte.</p>}
            {data.byClient.slice(0, 7).map((client) => (
              <div key={client.clientId}>
                <strong>{client.name}</strong>
                <span className="mona-m-bar"><i style={{ width: `${Math.round((client.todosDone / maxClientTodos) * 100)}%` }} /></span>
                <span>{client.todosDone} concluídas</span>
              </div>
            ))}
          </div>
        </section>
        <div className="mona-m-tip">
          <span className="mona-m-icon"><BarChart3 size={16} /></span>
          <div>
            <strong>Insight da MONA</strong>
            <p>{data.todos.done} tarefas concluídas, {data.agenda.meetings} reuniões, {data.decisions.open} decisões em aberto e {money(moneyPending)} pendentes no financeiro.</p>
          </div>
        </div>
      </div>

      <div className="mona-responsive-content mona-desk mona-report-desktop">
      <PageHeader title="Relatórios operacionais" subtitle={subtitle} />

      <div className="mona-report__filters">
        <Select label="Olhar" value={lens} onChange={(e) => setLens(e.target.value as Lens)}>
          {canAdm && <option value="adm">ADM / casa</option>}
          <option value="va">Minha VA</option>
          <option value="client">Cliente (precisa escolher a conta)</option>
        </Select>
        <Select label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
          <option value="day">Hoje</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
        </Select>
        <Select label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">{lens === 'client' ? '— escolha —' : 'Todos (no meu escopo)'}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mona-report__summary">
        <MobileStat icon={CheckSquare} label="Produtividade" value={`${donePct}%`} hint={`${data.todos.done} de ${taskTotal} tarefas concluídas`} tone="purple" />
        <MobileStat icon={Users} label="Reuniões" value={data.agenda.meetings} hint={`${data.agenda.events} compromissos no período`} tone="orange" />
        <MobileStat icon={Clock3} label="Horas registradas" value={`${data.time.hours.toLocaleString('pt-BR')}h`} hint={`${data.time.retainerUsedHours.toLocaleString('pt-BR')}h usadas do pacote`} tone="mint" />
        <MobileStat icon={Wallet} label="Financeiro pendente" value={money(moneyPending)} hint="nas gavetas visíveis" tone="rose" />
      </div>

      <section className="mona-report__section">
        <h2>Saúde operacional</h2>
        <div className="mona-report__diagnostics">
          <div><AlertTriangle size={18} /><span>Risco de atraso</span><strong>{overduePct}%</strong><small>{data.todos.overdue} de {data.todos.open} tarefas abertas</small></div>
          <div><Clock3 size={18} /><span>Uso do pacote</span><strong>{retainerPct}%</strong><small>{data.time.retainerUsedHours}h de {data.time.retainerHours}h contratadas</small></div>
          <div><BarChart3 size={18} /><span>Decisões abertas</span><strong>{data.decisions.open}</strong><small>{decisionOpenPct}% de {data.decisions.total} decisões</small></div>
          <div><FileCheck2 size={18} /><span>SOPs concluídos</span><strong>{data.sops.completedRuns}</strong><small>rotinas no período</small></div>
        </div>
      </section>

      {data.money && (
        <section className="mona-report__section">
          <h2>Fluxos financeiros</h2>
          <div className="mona-report__money">
          {data.money.agency && (
            <div><span>Fatto recebe do cliente</span><strong>{money(data.money.agency.paid)}</strong><small>Pendente {money(data.money.agency.pending)}</small></div>
          )}
          {data.money.clientAr && (
            <div><span>Cliente recebe</span><strong>{money(data.money.clientAr.paid)}</strong><small>Pendente {money(data.money.clientAr.pending)}</small></div>
          )}
          {data.money.clientAp && (
            <div><span>Cliente paga fornecedores</span><strong>{money(data.money.clientAp.paid)}</strong><small>Pendente {money(data.money.clientAp.pending)}</small></div>
          )}
          {data.money.payout && (
            <div><span>Repasse para VA</span><strong>{money(data.money.payout.paid)}</strong><small>Pendente {money(data.money.payout.pending)}</small></div>
          )}
          {typeof data.money.marginPaid === 'number' && (
            <div><span>Margem recebida</span><strong>{money(data.money.marginPaid)}</strong><small>Recebido menos repassado</small></div>
          )}
          </div>
        </section>
      )}

      <div className="mona-report__detail">
        <section className="mona-report__section">
          <h2>Uso do pacote por cliente</h2>
          <ul className="mona-report__client-list">
            {data.byClient.map((c) => (
              <li key={c.clientId}>
                <div><strong>{c.name}</strong><span>{c.todosDone} {c.todosDone === 1 ? 'entrega' : 'entregas'} · {(c.minutes / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h de {c.retainerHours}h</span></div>
                <span className="mona-report__track"><i style={{ width: `${c.retainerHours > 0 ? Math.min(100, Math.round((c.minutes / 60 / c.retainerHours) * 100)) : 0}%` }} /></span>
              </li>
            ))}
            {data.byClient.length === 0 && <p className="text-sm text-ink-500">Sem movimento no período.</p>}
          </ul>
        </section>

        <section className="mona-report__section">
          <h2>Evidências do período</h2>
          <ul className="mona-report__evidence">
            {data.evidence.todos.map((t) => (
              <li key={t.id}>
                <span>Entrega</span>{t.title}
                {t.clientName ? ` · ${t.clientName}` : ''}
              </li>
            ))}
            {data.evidence.decisions.map((d) => (
              <li key={d.id}>
                <span>{d.isOpen ? 'Decisão aberta' : 'Decisão fechada'}</span>{d.title}
                {d.visibleToClient ? ' · visível ao cliente' : ''}
              </li>
            ))}
            {data.evidence.todos.length === 0 && data.evidence.decisions.length === 0 && <li>Sem evidências neste período.</li>}
          </ul>
        </section>
      </div>

      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {canTime && (
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Registrar tempo</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Minutos" type="number" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} />
              <Input label="Nota" value={timeNote} onChange={(e) => setTimeNote(e.target.value)} />
            </div>
            <div className="mt-3">
              <Button disabled={timeMut.isPending} onClick={() => timeMut.mutate()}>Lançar horas</Button>
            </div>
            {timeMut.error && <ErrorAlert message={timeMut.error.message} />}
          </Card>
        )}
        {canDecision && (
          <Card>
            <h2 className="text-base font-semibold text-ink-900">Decisão de negócio</h2>
            <div className="mt-3 space-y-3">
              <Textarea label="O que ficou combinado" value={decTitle} onChange={(e) => setDecTitle(e.target.value)} />
              <Checkbox label="Cliente pode ver no portal" checked={decVisible} onChange={(e) => setDecVisible(e.target.checked)} />
              {canTime && <Checkbox label="Abrir tarefa automaticamente" checked={decTodo} onChange={(e) => setDecTodo(e.target.checked)} />}
              <Button disabled={!decTitle.trim() || decMut.isPending} onClick={() => decMut.mutate()}>Registrar decisão</Button>
            </div>
            {decMut.error && <ErrorAlert message={decMut.error.message} />}
          </Card>
        )}
        {canClientWrite && (
          <Card className="lg:col-span-2">
            <h2 className="text-base font-semibold text-ink-900">Ponto de atendimento e pacote de horas</h2>
            <p className="mt-1 text-sm text-ink-500">Escolha um cliente para configurar o canal de atendimento e o pacote de horas.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Input label="Nome do ponto" value={pointName} onChange={(e) => setPointName(e.target.value)} placeholder="WhatsApp comercial" />
              <Select label="Canal" value={pointChannel} onChange={(e) => setPointChannel(e.target.value)}>
                <option>WhatsApp</option><option>Email</option><option>Phone</option><option>Portal</option>
              </Select>
              <Input label="Horas do retainer / mês" type="number" value={retainerHours} onChange={(e) => setRetainerHours(e.target.value)} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" disabled={!clientId || !pointName.trim() || pointMut.isPending} onClick={() => pointMut.mutate()}>Salvar ponto</Button>
              <Button variant="secondary" disabled={!clientId || retainerMut.isPending} onClick={() => retainerMut.mutate()}>Salvar pacote</Button>
            </div>
            {pointMut.error && <ErrorAlert message={pointMut.error.message} />}
            {retainerMut.error && <ErrorAlert message={retainerMut.error.message} />}
            {points.length > 0 && (
              <ul className="mt-3 text-sm text-ink-700">
                {points.map((point) => <li key={point.id}>{point.name} · {point.channel}{point.slaMinutes ? ` · SLA ${point.slaMinutes} min` : ''}</li>)}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
