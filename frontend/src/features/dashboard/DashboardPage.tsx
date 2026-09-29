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
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react'
import { useAuth } from '../../shared/auth/AuthContext'
import { api } from '../../shared/api/client'
import type { AgendaEvent, TodoItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useUserPreferences } from '../../shared/hooks/useWorkspaceData'
import {
  BrandLogo,
  LoadingSpinner,
  MobileHero,
  MobileQuickActions,
  MobileRow,
  MobileSection,
  MobileStat,
  MobileTip,
  MonaWave,
  isSameLocalDay,
} from '../../shared/ui'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(name?: string) {
  return name?.split(' ').filter(Boolean)[0] || 'por aqui'
}


function localDay(value: string, timeZone: string) {
  return new Date(value).toLocaleDateString('en-CA', { timeZone })
}

export function DashboardPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { preferences } = useUserPreferences()
  const timeZone = preferences?.effectiveTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const canReadTodos = hasPermission(Permissions.TodosRead)
  const canReadAgenda = hasPermission(Permissions.AgendaRead)
  const canReadClients = hasPermission(Permissions.ClientsRead)
  const canReadFinance = hasPermission([Permissions.FinanceAll, Permissions.FinanceOwn])
  const canCreateTodos = hasPermission(Permissions.TodosWrite)
  const canCreateAgenda = hasPermission(Permissions.AgendaWrite)
  const canCreateClients = hasPermission(Permissions.ClientsWrite)

  const { data: reminders = [], isLoading: todosLoading, isError: todosError } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get<TodoItem[]>('/todos'),
    enabled: canReadTodos,
  })
  const { data: events = [], isLoading: agendaLoading, isError: agendaError } = useQuery({
    queryKey: ['agenda-events', timeZone],
    queryFn: () => api.get<AgendaEvent[]>(`/agenda/events?displayTimeZoneId=${encodeURIComponent(timeZone)}`),
    enabled: canReadAgenda,
  })

  if (todosLoading || agendaLoading) return <LoadingSpinner />

  const hasTodosData = canReadTodos && !todosError
  const hasAgendaData = canReadAgenda && !agendaError

  const now = new Date()
  const todayKey = localDay(now.toISOString(), timeZone)
  const openTodos = reminders.filter((todo) => todo.status !== 'Done')
  const todayDueTodos = reminders.filter((todo) => {
    const dueAt = todo.dueAtUtc || todo.dueAtLocal
    return dueAt && localDay(dueAt, timeZone) === todayKey
  })
  const todayTodos = todayDueTodos.filter((todo) => todo.status !== 'Done')
  const overdueTodos = openTodos.filter((todo) => todo.isOverdue)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const weekTodos = reminders.filter((todo) => {
    const dueAt = todo.dueAtUtc || todo.dueAtLocal
    if (!dueAt) return false
    const date = new Date(dueAt)
    return date >= weekStart && date < weekEnd
  })
  const weekProgress = weekTodos.length
    ? Math.round((weekTodos.filter((todo) => todo.status === 'Done').length / weekTodos.length) * 100)
    : null
  const todayEvents = events.filter((event) => localDay(event.startAtUtc || event.startAt, timeZone) === todayKey)
  const nextEvent = todayEvents
    .filter((event) => new Date(event.startAtUtc || event.startAt) >= now)
    .sort((a, b) => new Date(a.startAtUtc || a.startAt).getTime() - new Date(b.startAtUtc || b.startAt).getTime())[0]
  const nextTime = nextEvent
    ? new Date(nextEvent.startAtUtc || nextEvent.startAt).toLocaleTimeString('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit' })
    : null
  const agenda = todayEvents.length
  const canSummarizeDay = hasTodosData && hasAgendaData

  const quickActions = [
    { to: '/todos?novo=1', label: 'Nova tarefa', hint: 'Adicionar tarefa', icon: ListPlus, tone: 'purple', allowed: canCreateTodos && canReadTodos },
    { to: '/agenda?novo=1', label: 'Novo evento', hint: 'Agendar compromisso', icon: CalendarPlus, tone: 'orange', allowed: canCreateAgenda && canReadAgenda },
    { to: '/clientes?novo=1', label: 'Novo cliente', hint: 'Cadastrar cliente', icon: UserPlus, tone: 'purple', allowed: canCreateClients && canReadClients },
    { to: '/financeiro?novo=1&livro=ClientAp', label: 'Nova despesa', hint: 'Registrar despesa', icon: CirclePlus, tone: 'pink', allowed: canReadFinance },
  ].filter((action) => action.allowed)

  return (
    <div className="mona-home">
      <div className="mona-home__desktop mona-dashboard">
        <section className="mona-dashboard__hero">
          <MonaWave className="mona-dashboard__wave" />
          <div className="mona-dashboard__hero-copy">
            <p className="mona-dashboard__eyebrow">{greeting()}, {firstName(user?.name)}!</p>
            <h1>{canSummarizeDay && todayTodos.length === 0 && overdueTodos.length === 0 ? 'Seu dia está organizado' : 'Seu dia em movimento'} <Sparkles size={25} aria-hidden="true" /></h1>
            <p>
              {canSummarizeDay
                ? `Você tem ${agenda} ${agenda === 1 ? 'compromisso' : 'compromissos'} hoje e ${todayTodos.length} ${todayTodos.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'} para hoje.`
                : 'Acompanhe as informações disponíveis para o seu perfil.'}
            </p>
            <Link to="/operacao" className="mona-dashboard__primary">Ver prioridades <ArrowRight size={17} /></Link>
          </div>
          <div className="mona-dashboard__motto"><Sun size={24} /><span>Grandes dias começam com organização.</span></div>
          <BrandLogo variant="mark" size={122} title="" className="mona-dashboard__brand" />
        </section>

        <section className="mona-dashboard__metrics" aria-label="Resumo do dia">
          <Link to="/todos" className="mona-dashboard__metric is-purple">
            <span className="mona-dashboard__metric-icon"><CheckSquare size={27} /></span>
            <span className="mona-dashboard__metric-title">Pendências</span>
            <strong>{hasTodosData ? overdueTodos.length : '—'}</strong><span>atrasadas</span>
            <small>{todosError ? 'Não foi possível carregar tarefas' : !canReadTodos ? 'Sem acesso a tarefas' : overdueTodos.length === 0 ? 'Tudo em dia!' : `${overdueTodos.length} ${overdueTodos.length === 1 ? 'tarefa precisa' : 'tarefas precisam'} de atenção`}</small>
            <ArrowRight className="mona-dashboard__metric-arrow" size={18} />
          </Link>
          <Link to="/agenda" className="mona-dashboard__metric is-orange">
            <span className="mona-dashboard__metric-icon"><CalendarDays size={27} /></span>
            <span className="mona-dashboard__metric-title">Agenda</span>
            <strong>{hasAgendaData ? agenda : '—'}</strong><span>{agenda === 1 ? 'evento hoje' : 'eventos hoje'}</span>
            <small>{agendaError ? 'Não foi possível carregar a agenda' : !canReadAgenda ? 'Sem acesso à agenda' : nextTime ? `Próximo às ${nextTime}` : agenda ? 'Sem próximos eventos hoje' : 'Nenhum evento hoje'}</small>
            <ArrowRight className="mona-dashboard__metric-arrow" size={18} />
          </Link>
          <Link to="/relatorios" className="mona-dashboard__metric is-mint">
            <span className="mona-dashboard__metric-icon"><ListChecks size={27} /></span>
            <span className="mona-dashboard__metric-title">Progresso da semana</span>
            <strong>{hasTodosData && weekProgress !== null ? `${weekProgress}%` : '—'}</strong><span>das tarefas concluídas</span>
            <small>{todosError ? 'Não foi possível carregar tarefas' : !canReadTodos ? 'Sem acesso a tarefas' : weekTodos.length ? `${weekTodos.filter((todo) => todo.status === 'Done').length} de ${weekTodos.length} tarefas com prazo nesta semana` : 'Sem tarefas com prazo nesta semana'}</small>
            {hasTodosData && weekProgress !== null && <span className="mona-dashboard__progress"><span style={{ width: `${weekProgress}%` }} /></span>}
            <ArrowRight className="mona-dashboard__metric-arrow" size={18} />
          </Link>
        </section>

        <section className="mona-dashboard__section">
          <div className="mona-dashboard__section-head"><div><h2>Ações rápidas</h2><p>Crie e organize tudo em poucos cliques.</p></div></div>
          <div className="mona-dashboard__actions">
            {quickActions.map((action) => {
              const Icon = action.icon
              return <Link key={action.label} to={action.to} className={`mona-dashboard__action is-${action.tone}`}>
                <span className="mona-dashboard__action-icon"><Icon size={27} /></span>
                <strong>{action.label}</strong><span>{action.hint}</span><ArrowRight size={18} />
              </Link>
            })}
          </div>
        </section>

        <section className="mona-dashboard__section">
          <div className="mona-dashboard__section-head"><div><h2>Lembretes de hoje</h2><p>Aqui estão os destaques para o seu dia.</p></div><Link to="/todos">Ver todos <ArrowRight size={17} /></Link></div>
          <div className="mona-dashboard__reminders">
            {!hasTodosData ? (
              <div className="mona-dashboard__reminder"><span className="mona-dashboard__reminder-icon"><CheckSquare size={23} /></span><div><strong>{todosError ? 'Não foi possível carregar os lembretes' : 'Tarefas indisponíveis'}</strong><p>{todosError ? 'Tente novamente mais tarde.' : 'Seu perfil não tem acesso a tarefas.'}</p></div></div>
            ) : todayTodos.length === 0 ? (
              <div className="mona-dashboard__reminder"><span className="mona-dashboard__reminder-icon"><CheckSquare size={23} /></span><div><strong>Nada pendente para hoje</strong><p>Aproveite para adiantar a semana.</p></div></div>
            ) : todayTodos.slice(0, 3).map((todo) => (
              <Link key={todo.id} to="/todos" className="mona-dashboard__reminder"><span className="mona-dashboard__reminder-icon"><CheckSquare size={23} /></span><div><strong>{todo.title}</strong><p>{todo.clientName || 'Tarefa do dia'}</p></div><ArrowRight size={17} /></Link>
            ))}
          </div>
        </section>
      </div>

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
            value={hasTodosData ? todayTodos.length : '—'}
            hint={todosError ? 'Não foi possível carregar' : hasTodosData ? `${todayDueTodos.length} com prazo hoje` : 'Sem acesso a tarefas'}
            progress={hasTodosData && todayDueTodos.length ? Math.round((todayDueTodos.filter((todo) => todo.status === 'Done').length / todayDueTodos.length) * 100) : undefined}
            tone="purple"
          />
          <MobileStat
            to="/agenda"
            icon={CalendarDays}
            label="Reuniões de hoje"
            value={hasAgendaData ? agenda : '—'}
            hint={agendaError ? 'Não foi possível carregar' : hasAgendaData ? 'na sua agenda' : 'Sem acesso à agenda'}
            tone="orange"
          />
          <MobileStat
            to="/relatorios"
            icon={ListChecks}
            label="Seu progresso"
            value={!hasTodosData || weekProgress === null ? '—' : `${weekProgress}%`}
            hint="das tarefas da semana"
            progress={hasTodosData ? weekProgress ?? undefined : undefined}
            tone="mint"
          />
        </div>

        <MobileSection title="Ações rápidas">
          <MobileQuickActions items={quickActions} />
        </MobileSection>

        <MobileSection title="Lembretes de hoje" action={{ to: '/todos', label: 'Ver todas' }}>
          <div className="mona-m-list">
            {todayTodos.slice(0, 4).map((todo) => (
              <MobileRow
                key={todo.id}
                to="/todos"
                title={todo.title}
                meta={todo.clientName || (isSameLocalDay(todo.dueAtLocal) ? 'Hoje' : 'Pendente')}
                trailing={<ArrowRight size={16} />}
              />
            ))}
            {(!hasTodosData || todayTodos.length === 0) && (
              <MobileRow title={!hasTodosData ? 'Lembretes indisponíveis' : 'Nada pendente para hoje'} meta={!hasTodosData ? 'Não foi possível consultar suas tarefas' : 'Aproveite para adiantar a semana'} />
            )}
          </div>
        </MobileSection>

        <MobileTip>Comece o dia definindo 3 prioridades. Menos tarefas, mais resultado.</MobileTip>
      </section>
    </div>
  )
}
