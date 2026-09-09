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
import { Card, LoadingSpinner, PageHeader } from '../../shared/ui'

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

function KpiCard({
  to,
  label,
  value,
  hint,
  icon: Icon,
}: {
  to: string
  label: string
  value?: number
  hint?: string
  icon: typeof Users
}) {
  return (
    <Link to={to}>
      <Card hover className="h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink-900 app-font">{value ?? '—'}</p>
            {hint && <p className="mt-2 text-xs font-medium text-brand-800">{hint}</p>}
          </div>
          <div className="rounded-xl bg-brand-50 p-2.5 text-brand-800">
            <Icon size={18} />
          </div>
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
  ]

  return (
    <div>
      <PageHeader
        title={user?.isOwner ? 'Dashboard' : 'Minha área'}
        subtitle={`Olá, ${user?.name}. Visão rápida — para o dia a dia com muitos clientes, use o Modo operação.`}
      />

      <Link
        to="/operacao"
        className="mb-5 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-950 transition hover:bg-brand-100/60"
      >
        <span>
          <strong>Modo operação</strong> — fila do dia e grupos que a equipe define (sem engessar tipo de
          negócio no produto).
        </span>
        <ArrowUpRight size={16} />
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, 4).map((card) => (
          <KpiCard
            key={card.label}
            to={card.to}
            label={card.label}
            value={card.value}
            hint={'hint' in card ? card.hint : undefined}
            icon={card.icon}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink-900">Atalhos do sistema</h2>
            <ArrowUpRight size={16} className="text-ink-500" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="rounded-xl border border-ink-100 px-4 py-3 transition hover:border-brand-500/40 hover:bg-brand-50/40"
              >
                <p className="text-sm font-medium text-ink-900">{card.label}</p>
                <p className="mt-1 text-xs text-ink-500">Abrir módulo</p>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink-900">Ações rápidas</h2>
          <div className="space-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
              >
                {item.label}
                <ArrowUpRight size={14} className="text-brand-800" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
