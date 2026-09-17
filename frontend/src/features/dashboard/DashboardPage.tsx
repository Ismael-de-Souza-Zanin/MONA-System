import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CheckSquare,
  ListChecks,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../shared/auth/AuthContext'
import { api } from '../../shared/api/client'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { BrandLogo, Card, LoadingSpinner } from '../../shared/ui'

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
  'var(--mona-color-coral)',
  'var(--mona-color-orange)',
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
      <Card hover className="h-full rounded-[24px]">
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

  const quickLinks = [
    { to: '/todos', label: 'Nova tarefa' },
    { to: '/agenda', label: 'Agendar reunião' },
    { to: '/clientes', label: 'Novo cliente' },
    { to: '/financeiro', label: 'Registrar pagamento' },
    { to: '/sops', label: 'Abrir SOPs' },
    { to: '/relatorios', label: 'Relatórios do período' },
  ]

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <section className="mona-hero">
        <div className="relative z-[1] max-w-xl">
          <p className="text-sm font-semibold text-brand-800">
            {greeting()}, {firstName(user?.name)}
          </p>
          <h1 className="mona-hero__title">Confira tarefas e agenda do dia</h1>
          <p className="mt-2 text-sm text-ink-500">
            {user?.isOwner
              ? 'Visão rápida da operação. Para o dia a dia com muitos clientes, use o Modo operação.'
              : 'Sua área: o que importa agora, sem ruído.'}{' '}
            Tenha um ótimo dia.
          </p>
        </div>
        <div className="mona-hero__art" aria-hidden>
          <span className="mona-blob top-2 left-6 h-16 w-20 bg-[color:var(--mona-color-purple)]/40" />
          <span className="mona-blob right-4 top-0 h-12 w-12 bg-[color:var(--mona-color-pink)]/50" />
          <span className="mona-blob bottom-2 left-10 h-10 w-14 bg-[color:var(--mona-color-orange)]/45" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BrandLogo size={88} />
          </div>
        </div>
      </section>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <Link
          to="/relatorios"
          className="flex items-center justify-between rounded-3xl bg-brand-50 px-4 py-3 text-sm text-brand-950 transition hover:brightness-95"
        >
          <span>
            <strong>Relatórios</strong> — dia, semana e mês nas lentes cliente, ADM e VA.
          </span>
          <ArrowUpRight size={16} />
        </Link>
        <Link
          to="/operacao"
          className="flex items-center justify-between rounded-3xl mona-tint-orange px-4 py-3 text-sm text-ink-900 transition hover:brightness-95"
        >
          <span>
            <strong>Modo operação</strong> — fila do dia e grupos que a equipe define.
          </span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="rounded-[24px]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink-900">Atalhos do sistema</h2>
                <ArrowUpRight size={16} className="text-ink-500" />
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

            <Card className="rounded-[24px]">
              <h2 className="mb-4 text-base font-semibold text-ink-900">Ações rápidas</h2>
              <div className="space-y-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="flex items-center justify-between rounded-2xl border border-ink-100 px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
                  >
                    {item.label}
                    <ArrowUpRight size={14} className="text-brand-800" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <aside className="hidden xl:block">
          <Card className="rounded-[24px]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">Meu perfil</p>
            <div className="mt-4 flex items-center gap-3">
              <BrandLogo size={52} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">{user?.name}</p>
                <p className="text-xs text-ink-500">{user?.isOwner ? 'Conta principal' : 'Usuário compartilhado'}</p>
              </div>
            </div>
            <p className="mt-5 text-xs capitalize text-ink-500">{today}</p>
            <div className="mt-3 space-y-2">
              <Link to="/todos" className="flex items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5 text-sm">
                <span>Tarefas pendentes</span>
                <strong>{stats?.myTodos ?? 0}</strong>
              </Link>
              <Link to="/agenda" className="mona-tint-orange flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm">
                <span>Agenda de hoje</span>
                <strong>{stats?.agendaToday ?? stats?.myAgenda ?? 0}</strong>
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
