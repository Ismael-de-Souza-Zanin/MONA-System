import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  CirclePlus,
  ListChecks,
  ListPlus,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../shared/auth/AuthContext'
import { api } from '../../shared/api/client'
import type { TodoItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  BrandLogo,
  Card,
  LoadingSpinner,
  MobileHero,
  MobileQuickActions,
  MobileRow,
  MobileSection,
  MobileStat,
  MobileTip,
  MonaArrow,
  MonaWave,
  isSameLocalDay,
} from '../../shared/ui'

interface DashboardStats {
  clients?: number
  activeClients?: number
  paymentsPending?: number
  employees?: number
  partners?: number
  services?: number
  contracts?: number
  onboardingPending?: number
  agendaToday?: number
  myClients?: number
  myTodos?: number
  myAgenda?: number
  requests?: number
}

const KPI_TONES = [
  'var(--mona-color-purple)',
  'var(--mona-color-pink)',
  'var(--mona-color-orange)',
  '#8B4BB8',
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(name?: string) {
  return name?.split(' ').filter(Boolean)[0] || 'por aqui'
}

function KpiCard({
  to,
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  to: string
  label: string
  value?: number
  hint?: string
  icon: typeof Users
  tone: string
}) {
  return (
    <Link to={to}>
      <Card hover className="mona-folder h-full rounded-[24px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink-900 app-font">{value ?? '—'}</p>
            {hint && <p className="mt-2 text-xs font-medium text-brand-800">{hint}</p>}
          </div>
          <div className="mona-kpi__icon" style={{ background: tone }}>
            <Icon size={18} />
          </div>
        </div>
        <div className="mt-4 flex h-10 items-end gap-1">
          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-t-md"
              style={{ height: `${h}%`, background: tone, opacity: 0.28 + i * 0.08 }}
            />
          ))}
        </div>
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<DashboardStats>('/dashboard/stats'),
  })

  const { data: reminders = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get<TodoItem[]>('/todos'),
  })

  if (isLoading) return <LoadingSpinner />

  const companyCards = [
    {
      to: '/clientes',
      label: 'Clientes',
      value: stats?.activeClients ?? stats?.clients,
      hint: `${stats?.clients ?? 0} no total`,
      icon: Users,
      perm: Permissions.ClientsRead,
    },
    {
      to: '/financeiro',
      label: 'Financeiro',
      value: stats?.paymentsPending,
      hint: 'Cobranças pendentes',
      icon: Wallet,
      perm: [Permissions.FinanceAll, Permissions.FinanceOwn],
    },
    {
      to: '/onboarding',
      label: 'Onboarding',
      value: stats?.onboardingPending,
      hint: 'Em andamento',
      icon: ListChecks,
      perm: Permissions.OnboardingRead,
    },
    {
      to: '/todos',
      label: 'Tarefas',
      value: stats?.myTodos,
      hint: 'Pendentes',
      icon: CheckSquare,
      perm: Permissions.TodosRead,
    },
    {
      to: '/agenda',
      label: 'Agenda',
      value: stats?.agendaToday,
      hint: 'Hoje',
      icon: CalendarDays,
      perm: Permissions.AgendaRead,
    },
  ]

  const userCards = [
    { to: '/clientes', label: 'Meus clientes', value: stats?.myClients, icon: Users, perm: Permissions.ClientsRead },
    { to: '/financeiro', label: 'Meu financeiro', value: stats?.paymentsPending, icon: Wallet, perm: Permissions.FinanceOwn },
    { to: '/todos', label: 'To do', value: stats?.myTodos, icon: CheckSquare, perm: Permissions.TodosRead },
    { to: '/agenda', label: 'Agenda', value: stats?.myAgenda, icon: CalendarDays, perm: Permissions.AgendaRead },
  ]

  const cards = (user?.isOwner ? companyCards : userCards).filter((c) => hasPermission(c.perm))
  const todos = stats?.myTodos ?? 0
  const agenda = stats?.agendaToday ?? stats?.myAgenda ?? 0

  const quickLinks = [
    { to: '/todos', label: 'Nova tarefa' },
    { to: '/agenda', label: 'Agendar reunião' },
    { to: '/clientes', label: 'Novo cliente' },
    { to: '/financeiro', label: 'Registrar pagamento' },
    { to: '/sops', label: 'Abrir SOPs' },
    { to: '/relatorios', label: 'Relatórios do período' },
  ]

  const quickActions = [
    { to: '/todos', label: 'Nova tarefa', icon: ListPlus },
    { to: '/agenda', label: 'Novo evento', icon: CalendarPlus },
    { to: '/clientes', label: 'Novo cliente', icon: UserPlus },
    { to: '/financeiro', label: 'Nova despesa', icon: CirclePlus },
  ]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mona-home">
      <section className="mona-hero mona-hero--stage">
        <MonaWave className="mona-hero__wave" />
        <MonaArrow tone="purple" className="mona-hero__arrow" />
        <div className="relative z-[2] max-w-xl">
          <p className="mona-hero__kicker">
            {greeting()}, {firstName(user?.name)}!
          </p>
          <h1 className="mona-hero__title">Planeje seu dia com mais leveza</h1>
          <p className="mt-2 text-sm text-ink-500">
            {user?.isOwner
              ? 'Visão rápida da operação. Para o dia a dia com muitos clientes, use o Modo operação.'
              : 'Sua área: o que importa agora, sem ruído.'}{' '}
            Tenha um ótimo dia.
          </p>
          <Link to="/operacao" className="mona-hero__cta">
            Entrar no modo operação
            <ArrowRight size={16} />
          </Link>
        </div>
        <p className="mona-hero__note">Mais para o que importa</p>
        <div className="mona-hero__art" aria-hidden>
          <BrandLogo variant="mark" size={176} title="" className="mona-hero__mark" />
        </div>
        <div className="mona-hero__card mona-folder">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Hoje</p>
          <p className="mt-1 text-sm capitalize text-ink-700">{today}</p>
          <div className="mt-3 space-y-2">
            <Link to="/todos" className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5 text-sm">
              <span>Tarefas pendentes</span>
              <strong>{todos}</strong>
            </Link>
            <Link to="/agenda" className="mona-tint-orange flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm">
              <span>Agenda de hoje</span>
              <strong>{agenda}</strong>
            </Link>
          </div>
        </div>
      </section>

      <section className="mona-home__mobile mona-m-stack">
        <MobileHero
          kicker={`${greeting()}, ${firstName(user?.name)}!`}
          title="Planeje seu dia com mais leveza"
          lead="Organize suas tarefas, acompanhe a agenda e foque no que realmente importa."
          cta={{ to: '/operacao', label: 'Começar meu dia agora' }}
          note="Grandes dias começam com organização"
        />

        <div className="mona-m-stats">
          <MobileStat
            to="/todos"
            icon={CheckSquare}
            label="Tarefas de hoje"
            value={todos}
            hint={`de ${Math.max(todos, reminders.length || todos)} no total`}
            progress={reminders.length ? Math.round(((reminders.length - todos) / reminders.length) * 100) : todos ? 38 : 100}
            tone="purple"
          />
          <MobileStat
            to="/agenda"
            icon={CalendarDays}
            label="Reuniões de hoje"
            value={agenda}
            hint="na sua agenda"
            progress={agenda ? Math.min(100, 40 + agenda * 12) : 100}
            tone="orange"
          />
          <MobileStat
            to="/relatorios"
            icon={ListChecks}
            label="Seu progresso"
            value={`${reminders.length ? Math.round((reminders.filter((t) => t.status === 'Done').length / reminders.length) * 100) : 80}%`}
            hint="das tarefas da semana"
            progress={reminders.length ? Math.round((reminders.filter((t) => t.status === 'Done').length / reminders.length) * 100) : 80}
            tone="mint"
          />
        </div>

        <MobileSection title="Ações rápidas" action={{ to: '/apps', label: 'Ver todas' }}>
          <MobileQuickActions items={quickActions} />
        </MobileSection>

        <MobileSection title="Lembretes de hoje" action={{ to: '/todos', label: 'Ver todas' }}>
          <div className="mona-m-list">
            {(reminders.filter((t) => t.status !== 'Done' && (isSameLocalDay(t.dueAtLocal) || isSameLocalDay(t.dueAtUtc))).length
              ? reminders.filter((t) => t.status !== 'Done' && (isSameLocalDay(t.dueAtLocal) || isSameLocalDay(t.dueAtUtc)))
              : reminders.filter((t) => t.status !== 'Done')
            ).slice(0, 4).map((todo) => (
              <MobileRow
                key={todo.id}
                to="/todos"
                title={todo.title}
                meta={todo.clientName || (isSameLocalDay(todo.dueAtLocal) ? 'Hoje' : 'Pendente')}
                trailing={<ArrowRight size={16} />}
              />
            ))}
            {reminders.every((t) => t.status === 'Done') && (
              <MobileRow title="Nada pendente para hoje" meta="Aproveite para adiantar a semana" />
            )}
          </div>
        </MobileSection>

        <MobileTip>Comece o dia definindo 3 prioridades. Menos tarefas, mais resultado.</MobileTip>
      </section>

      <div className="mona-home__desktop mb-5 grid gap-3 pt-2 md:grid-cols-2">
        <Link
          to="/relatorios"
          className="mona-folder flex items-center justify-between rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-950 transition hover:brightness-95"
        >
          <span>
            <strong>Relatórios</strong> — dia, semana e mês nas lentes cliente, ADM e VA.
          </span>
          <MonaArrow tone="purple" className="h-7 w-7 shrink-0" />
        </Link>
        <Link
          to="/operacao"
          className="mona-folder flex items-center justify-between rounded-3xl mona-tint-orange px-4 py-3 text-sm text-ink-900 transition hover:brightness-95"
        >
          <span>
            <strong>Modo operação</strong> — fila do dia e grupos que a equipe define.
          </span>
          <MonaArrow tone="orange" className="h-7 w-7 shrink-0" />
        </Link>
      </div>

      <div className="mona-home__desktop grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, 4).map((card, index) => (
          <KpiCard
            key={card.label}
            to={card.to}
            label={card.label}
            value={card.value}
            hint={'hint' in card ? card.hint : undefined}
            icon={card.icon}
            tone={KPI_TONES[index % KPI_TONES.length]}
          />
        ))}
      </div>

      <div className="mona-home__desktop mt-6 grid gap-4 pt-2 lg:grid-cols-[1.4fr_1fr]">
        <Card className="mona-folder rounded-[24px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">Atalhos do sistema</h2>
            <MonaArrow tone="purple" className="h-5 w-5" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-2xl border border-ink-100 px-4 py-3 transition hover:border-brand-500/40 hover:bg-brand-50/40"
              >
                <p className="text-sm font-medium text-ink-900">{card.label}</p>
                <p className="mt-1 text-xs text-ink-500">Abrir módulo</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="mona-folder rounded-[24px]">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Ações rápidas</h2>
          <div className="space-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center justify-between rounded-2xl border border-ink-100 px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
              >
                {item.label}
                <MonaArrow tone="purple" className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
