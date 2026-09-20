import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../shared/api/client'
import { useAuth } from '../../shared/auth/AuthContext'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  Checkbox,
  Input,
  LoadingSpinner,
  MobileChip,
  MobileChips,
  MobileHero,
  MobileStat,
  MobileTip,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'
import { CheckSquare, Clock3, Users, Wallet } from 'lucide-react'

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

  const { data, isLoading } = useQuery({
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
        createTodo: decTodo,
      }),
    onSuccess: () => {
      setDecTitle('')
      void qc.invalidateQueries({ queryKey: ['ops-report'] })
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
  })

  if (lens === 'client' && !clientId) {
    return (
      <div>
        <PageHeader title="Relatórios operacionais" subtitle="Escolha o cliente para ver o que ele pode validar." />
        <Select label="Cliente" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">— escolha —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
    )
  }

  if (isLoading || !data || Array.isArray(data) || !data.todos) return <LoadingSpinner />

  const subtitle =
    lens === 'adm'
      ? 'Desempenho do time, gavetas B/C e margem — o cliente não vê isto.'
      : lens === 'va'
        ? 'Sua fila, suas horas e o seu repasse.'
        : 'O que este cliente pode validar: entregas e decisões visíveis.'

  const done = data.todos.done
  const open = data.todos.open
  const productivity = done + open ? Math.round((done / (done + open)) * 100) : 0

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <MobileHero
          kicker="Relatórios"
          title="Seu progresso em números"
          lead="Acompanhe resultados, identifique oportunidades e veja como a MONA impulsiona o dia a dia."
          note="Dados que geram mais tempo"
        />
        <MobileChips>
          {([
            ['day', 'Hoje'],
            ['week', 'Semana'],
            ['month', 'Mês'],
          ] as const).map(([id, label]) => (
            <MobileChip key={id} active={period === id} onClick={() => setPeriod(id)}>
              {label}
            </MobileChip>
          ))}
        </MobileChips>
        <div className="mona-m-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <MobileStat icon={CheckSquare} label="Produtividade" value={`${productivity}%`} hint="tarefas concluídas" tone="purple" progress={productivity} />
          <MobileStat icon={CheckSquare} label="Tarefas concluídas" value={done} hint={`${open} em aberto`} tone="mint" />
          <MobileStat icon={Users} label="Reuniões" value={data.agenda.meetings} hint={`${data.agenda.events} compromissos`} tone="orange" />
          <MobileStat icon={Clock3} label="Horas" value={`${data.time.hours}h`} hint={`pacote ${data.time.retainerHours}h`} tone="rose" />
        </div>
        {data.money?.agency && (
          <MobileStat icon={Wallet} label="Fatto recebido" value={money(data.money.agency.paid)} hint={`Pendente ${money(data.money.agency.pending)}`} tone="purple" />
        )}
        <MobileTip>Você concluiu {done} tarefas neste recorte. Ótimo progresso.</MobileTip>
      </div>

      <div className="mona-desktop-only">
      <PageHeader title="Relatórios operacionais" subtitle={subtitle} />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase text-ink-500">Tarefas feitas</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{data.todos.done}</p>
          <p className="text-xs text-ink-500">{data.todos.open} abertas · {data.todos.overdue} atrasadas</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink-500">Reuniões / agenda</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{data.agenda.meetings}</p>
          <p className="text-xs text-ink-500">{data.agenda.events} compromissos no período</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink-500">Decisões</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{data.decisions.total}</p>
          <p className="text-xs text-ink-500">{data.decisions.open} em aberto</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-ink-500">Horas</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{data.time.hours}</p>
          <p className="text-xs text-ink-500">
            Pacote {data.time.retainerHours}h · usado {data.time.retainerUsedHours}h
          </p>
        </Card>
      </div>

      {data.money && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.money.agency && (
            <Card>
              <p className="text-xs uppercase text-ink-500">B · Fatto ← cliente</p>
              <p className="mt-1 font-semibold">{money(data.money.agency.paid)}</p>
              <p className="text-xs text-ink-500">Pendente {money(data.money.agency.pending)}</p>
            </Card>
          )}
          {data.money.clientAr && (
            <Card>
              <p className="text-xs uppercase text-ink-500">A · Cliente recebe</p>
              <p className="mt-1 font-semibold">{money(data.money.clientAr.paid)}</p>
            </Card>
          )}
          {data.money.payout && (
            <Card>
              <p className="text-xs uppercase text-ink-500">C · Fatto → VA</p>
              <p className="mt-1 font-semibold">{money(data.money.payout.paid)}</p>
              <p className="text-xs text-ink-500">O cliente não vê esta gaveta</p>
            </Card>
          )}
          {typeof data.money.marginPaid === 'number' && (
            <Card>
              <p className="text-xs uppercase text-ink-500">Margem (B − C)</p>
              <p className="mt-1 font-semibold">{money(data.money.marginPaid)}</p>
              <p className="text-xs text-ink-500">Só ADM</p>
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Registrar tempo</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input label="Minutos" type="number" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} />
            <Input label="Nota" value={timeNote} onChange={(e) => setTimeNote(e.target.value)} />
          </div>
          <div className="mt-3">
            <Button disabled={timeMut.isPending} onClick={() => timeMut.mutate()}>
              Lançar horas
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Decisão de negócio</h2>
          <div className="mt-3 space-y-3">
            <Textarea label="O que ficou combinado" value={decTitle} onChange={(e) => setDecTitle(e.target.value)} />
            <Checkbox
              label="Cliente pode ver no portal"
              checked={decVisible}
              onChange={(e) => setDecVisible(e.target.checked)}
            />
            <Checkbox
              label="Abrir tarefa automaticamente"
              checked={decTodo}
              onChange={(e) => setDecTodo(e.target.checked)}
            />
            <Button disabled={!decTitle.trim() || decMut.isPending} onClick={() => decMut.mutate()}>
              Registrar decisão
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-base font-semibold text-ink-900">Por cliente</h2>
          <ul className="mt-3 space-y-2">
            {data.byClient.map((c) => (
              <li key={c.clientId} className="flex justify-between text-sm">
                <span className="font-medium text-ink-900">{c.name}</span>
                <span className="text-ink-500">
                  {c.todosDone} entregas · {Math.round(c.minutes / 60)}h / {c.retainerHours}h
                </span>
              </li>
            ))}
            {data.byClient.length === 0 && <p className="text-sm text-ink-500">Sem movimento no período.</p>}
          </ul>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-ink-900">Evidência</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.evidence.todos.map((t) => (
              <li key={t.id} className="text-ink-800">
                Feito: {t.title}
                {t.clientName ? ` · ${t.clientName}` : ''}
              </li>
            ))}
            {data.evidence.decisions.map((d) => (
              <li key={d.id} className="text-ink-800">
                Decisão{d.isOpen ? '' : ' (fechada)'}: {d.title}
                {d.visibleToClient ? ' · visível ao cliente' : ''}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="text-base font-semibold text-ink-900">Ponto de atendimento e pacote de horas</h2>
        <p className="mt-1 text-sm text-ink-500">
          Escolha um cliente. Canal, o que perguntar e para quem escalar — sem criar um sistema por ramo.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input label="Nome do ponto" value={pointName} onChange={(e) => setPointName(e.target.value)} placeholder="WhatsApp comercial" />
          <Select label="Canal" value={pointChannel} onChange={(e) => setPointChannel(e.target.value)}>
            <option>WhatsApp</option>
            <option>Email</option>
            <option>Phone</option>
            <option>Portal</option>
          </Select>
          <Input
            label="Horas do retainer / mês"
            type="number"
            value={retainerHours}
            onChange={(e) => setRetainerHours(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!clientId || !pointName.trim() || pointMut.isPending}
            onClick={() => pointMut.mutate()}
          >
            Salvar ponto
          </Button>
          <Button
            variant="secondary"
            disabled={!clientId || retainerMut.isPending}
            onClick={() => retainerMut.mutate()}
          >
            Salvar pacote
          </Button>
        </div>
        {points.length > 0 && (
          <ul className="mt-3 text-sm text-ink-700">
            {points.map((p) => (
              <li key={p.id}>
                {p.name} · {p.channel}
                {p.slaMinutes ? ` · SLA ${p.slaMinutes} min` : ''}
              </li>
            ))}
          </ul>
        )}
      </Card>
      </div>
    </div>
  )
}
