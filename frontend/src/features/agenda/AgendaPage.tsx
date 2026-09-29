import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BarChart3, CalendarDays, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Clock3, ListTodo, MoreHorizontal, Plus, Tag, UserRound, UsersRound } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { AgendaCategory, AgendaEvent } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useAuth } from '../../shared/auth/AuthContext'
import { useTimeZones, useUserPreferences } from '../../shared/hooks/useWorkspaceData'
import {
  Button,
  EmptyState,
  ErrorAlert,
  Input,
  LoadingSpinner,
  MobileChip,
  MobileChips,
  Modal,
  Select,
  Textarea,
  isSameLocalDay,
} from '../../shared/ui'

type ColorView = 'individual' | 'role' | 'mine' | 'others'

function shiftDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  next.setHours(12, 0, 0, 0)
  return next
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function monthTitle(value: Date) {
  const label = value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(' de ', ' ')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function untilLabel(iso: string) {
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (mins < 0) return 'Em andamento'
  if (mins < 60) return `Em ${mins} min`
  const hours = Math.round(mins / 60)
  return hours < 24 ? `Em ${hours} h` : `Em ${Math.round(hours / 24)} d`
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function dayHeading(value: Date, today: Date) {
  const date = value.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).toUpperCase()
  return sameDay(value, today) ? `HOJE, ${date}` : date
}

function eventMinutes(iso: string) {
  const date = new Date(iso)
  return date.getHours() * 60 + date.getMinutes()
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours && rest ? `${hours}h ${rest}min` : hours ? `${hours}h` : `${rest}min`
}

function layoutDayEvents(events: AgendaEvent[]) {
  const placed: { event: AgendaEvent; lane: number; lanes: number }[] = []
  let group: { event: AgendaEvent; lane: number }[] = []
  let laneEnds: number[] = []
  let groupEnd = 0
  const finishGroup = () => {
    group.forEach(({ event, lane }) => placed.push({ event, lane, lanes: laneEnds.length }))
    group = []
    laneEnds = []
  }

  for (const event of events) {
    const start = new Date(event.startAt).getTime()
    const end = Math.max(start + 45 * 60_000, new Date(event.endAt || event.startAt).getTime())
    if (group.length && start >= groupEnd) finishGroup()
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = end
    group.push({ event, lane })
    groupEnd = Math.max(groupEnd, end)
  }
  finishGroup()
  return placed
}

export function AgendaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.AgendaWrite)
  const canSeeOthers = hasPermission(Permissions.AgendaOthers)
  const qc = useQueryClient()

  const [colorView, setColorView] = useState<ColorView>('individual')
  const [showEvent, setShowEvent] = useState(false)

  useEffect(() => {
    if (searchParams.get('novo') !== '1') return
    if (canWrite) setShowEvent(true)
  }, [searchParams, canWrite])

  const closeEvent = () => {
    setShowEvent(false)
    if (searchParams.has('novo')) setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('novo')
      return next
    }, { replace: true })
  }
  const [showCategory, setShowCategory] = useState(false)
  const { preferences } = useUserPreferences()
  const { data: timezones = [] } = useTimeZones()
  const [eventForm, setEventForm] = useState({
    title: '',
    startAt: '',
    endAt: '',
    categoryId: '',
    description: '',
    clientId: '',
    timeZoneId: 'America/Sao_Paulo',
    remindMinutesBefore: '30',
    kind: 'Event',
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#006D69' })

  const displayTz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId
  const { data: events = [], isLoading, error: eventsError } = useQuery({
    queryKey: ['agenda-events', displayTz],
    queryFn: () =>
      api.get<AgendaEvent[]>(
        `/agenda/events${displayTz ? `?displayTimeZoneId=${encodeURIComponent(displayTz)}` : ''}`,
      ),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['agenda-categories'],
    queryFn: () => api.get<AgendaCategory[]>('/agenda/categories'),
  })

  const filteredEvents = useMemo(() => {
    if (colorView === 'mine') {
      return events.filter((e) => e.responsibleUserId === user?.id)
    }
    if (colorView === 'others' && canSeeOthers) {
      return events.filter((e) => e.responsibleUserId !== user?.id)
    }
    return events
  }, [events, colorView, user?.id, canSeeOthers])

  const getEventColor = (event: AgendaEvent) => {
    if (colorView === 'role') {
      return event.clientId ? '#2563eb' : '#0F4C5C'
    }
    return event.categoryColor || '#0F4C5C'
  }

  const eventMutation = useMutation({
    mutationFn: () =>
      api.post('/agenda/events', {
        title: eventForm.title,
        startAt: eventForm.startAt,
        endAt: eventForm.endAt || undefined,
        categoryId: eventForm.categoryId || null,
        description: eventForm.description || undefined,
        clientId: eventForm.clientId || null,
        timeZoneId: eventForm.timeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo',
        remindMinutesBefore: Number(eventForm.remindMinutesBefore || 30),
        isUtc: false,
        kind: eventForm.kind,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda-events'] })
      closeEvent()
    },
  })

  const categoryMutation = useMutation({
    mutationFn: () => api.post('/agenda/categories', categoryForm),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda-categories'] })
      setShowCategory(false)
      setCategoryForm({ name: '', color: '#0F4C5C' })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/agenda/categories/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['agenda-categories'] }),
  })

  const [showAllDays, setShowAllDays] = useState(false)
  const [calendarView, setCalendarView] = useState<'week' | 'day'>('week')
  const [selectedDay, setSelectedDay] = useState(() => new Date())

  if (isLoading) return <LoadingSpinner />

  const visibleEvents = showAllDays ? filteredEvents : filteredEvents.filter((event) => isSameLocalDay(event.startAt, selectedDay))
  const dayEvents = filteredEvents
    .filter((event) => isSameLocalDay(event.startAt, selectedDay))
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
  const positionedEvents = layoutDayEvents(dayEvents)
  const upcomingEvents = filteredEvents
    .filter((event) => new Date(event.endAt || event.startAt).getTime() >= Date.now())
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    .slice(0, 3)
  const firstHour = Math.min(8, ...dayEvents.map((event) => Math.floor(eventMinutes(event.startAt) / 60)))
  const lastHour = Math.max(19, ...dayEvents.map((event) => Math.ceil(eventMinutes(event.endAt || event.startAt) / 60)))
  const timelineHours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index)
  const meetingMinutes = dayEvents.reduce((total, event) => {
    if (event.kind !== 'Meeting') return total
    return total + Math.max(0, eventMinutes(event.endAt || event.startAt) - eventMinutes(event.startAt))
  }, 0)
  const linkedTaskCount = dayEvents.reduce((total, event) => total + (event.linkedTodos?.length || 0), 0)

  const today = new Date()
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(selectedDay)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - day.getDay() + i)
    return day
  })

  return (
    <div>
      <div className="mona-responsive-content">
      {eventsError && <ErrorAlert message={eventsError.message} />}
      <section className="mona-desk mona-agenda-desktop">
        <header className="mona-agenda-desktop__header">
          <div className="mona-agenda-desktop__identity">
            <span className="mona-agenda-desktop__mark"><CalendarDays size={26} /></span>
            <div>
              <h1>Agenda</h1>
              <p>Organize seus compromissos, reuniões e próximos passos.</p>
              <small>Horário em {displayTz || 'America/Sao_Paulo'}.</small>
            </div>
          </div>
          <div className="mona-agenda-desktop__actions">
            {canWrite && <Button variant="secondary" onClick={() => setShowCategory(true)}><Tag size={17} /> Categorias</Button>}
            {canWrite && <Button onClick={() => setShowEvent(true)}><Plus size={19} /> Adicionar evento</Button>}
          </div>
        </header>

        <nav className="mona-agenda-desktop__modes" aria-label="Visualização da agenda">
          {[
            { id: 'individual' as const, label: 'Cores individuais', icon: CalendarDays },
            { id: 'role' as const, label: 'Funcionário vs cliente', icon: UserRound },
            { id: 'mine' as const, label: 'Minhas reuniões', icon: CalendarDays },
            ...(canSeeOthers ? [{ id: 'others' as const, label: 'Reuniões alheias', icon: UsersRound }] : []),
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-pressed={colorView === id} className={colorView === id ? 'is-active' : ''} onClick={() => setColorView(id)}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>

        <div className="mona-agenda-desktop__calendar">
          <div className="mona-agenda-desktop__toolbar">
            <div className="mona-agenda-desktop__month-nav">
              <button type="button" aria-label="Semana anterior" onClick={() => setSelectedDay((day) => shiftDays(day, -7))}><ChevronLeft size={18} /></button>
              <button type="button" aria-label="Próxima semana" onClick={() => setSelectedDay((day) => shiftDays(day, 7))}><ChevronRight size={18} /></button>
              <h2>{monthTitle(selectedDay)}</h2>
            </div>
            <div className="mona-agenda-desktop__toolbar-actions">
              <button type="button" className="mona-agenda-desktop__today" onClick={() => { setSelectedDay(shiftDays(today, 0)); setShowAllDays(false) }}>Hoje</button>
              <label className="mona-agenda-desktop__view">
                <span className="sr-only">Visualização do calendário</span>
                <select value={calendarView} onChange={(event) => setCalendarView(event.target.value as 'week' | 'day')}>
                  <option value="week">Semana</option>
                  <option value="day">Dia</option>
                </select>
                <ChevronDown size={16} />
              </label>
              <button type="button" className="mona-agenda-desktop__icon-btn" aria-label={showAllDays ? 'Mostrar dia selecionado' : 'Mostrar todos os eventos'} onClick={() => setShowAllDays((value) => !value)}><CalendarDays size={18} /></button>
            </div>
          </div>

          <div className="mona-agenda-desktop__columns">
            <div className="mona-agenda-desktop__primary">
              {calendarView === 'week' && <div className="mona-agenda-desktop__week">
                {weekDays.map((day) => {
                  const eventsOnDay = filteredEvents.filter((event) => isSameLocalDay(event.startAt, day))
                  return <button key={day.toISOString()} type="button" className={sameDay(day, selectedDay) && !showAllDays ? 'is-active' : ''} aria-pressed={sameDay(day, selectedDay) && !showAllDays} onClick={() => { setSelectedDay(day); setShowAllDays(false) }}>
                    <span>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <strong>{day.getDate()}</strong>
                    <span className="mona-agenda-desktop__dots">{eventsOnDay.slice(0, 3).map((event) => <i key={event.id} style={{ backgroundColor: getEventColor(event) }} />)}</span>
                  </button>
                })}
              </div>}
              <div className="mona-agenda-desktop__day">
                <div className="mona-agenda-desktop__day-head">
                  <h3>{showAllDays ? 'Todos os compromissos' : sameDay(selectedDay, today) ? `Hoje, ${selectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}` : selectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>
                  <span>{showAllDays ? filteredEvents.length : dayEvents.length} eventos</span>
                  <button type="button" onClick={() => setShowAllDays((value) => !value)}><ListTodo size={15} />{showAllDays ? 'Ver dia' : 'Ver todos'}</button>
                </div>
                {showAllDays ? <div className="mona-agenda-desktop__all">
                  {[...filteredEvents].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt)).map((event) => <div key={event.id} className="mona-agenda-desktop__all-row" style={{ '--agenda-event-color': getEventColor(event) } as CSSProperties}>
                    <time>{new Date(event.startAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {clock(event.startAt)}</time>
                    <strong>{event.title}</strong><span>{event.clientName || event.categoryName || 'Compromisso'}</span>
                  </div>)}
                  {filteredEvents.length === 0 && <EmptyState title="Nenhum evento na agenda" />}
                </div> : <div className="mona-agenda-desktop__timeline" style={{ height: (lastHour - firstHour) * 64 }}>
                  <div className="mona-agenda-desktop__times">{timelineHours.map((hour) => <time key={hour} style={{ top: (hour - firstHour) * 64 }}>{String(hour).padStart(2, '0')}:00</time>)}</div>
                  <div className="mona-agenda-desktop__track">
                    {sameDay(selectedDay, today) && eventMinutes(today.toISOString()) >= firstHour * 60 && eventMinutes(today.toISOString()) <= lastHour * 60 && <div className="mona-agenda-desktop__now" style={{ top: (eventMinutes(today.toISOString()) - firstHour * 60) / 60 * 64 }} />}
                    {positionedEvents.map(({ event, lane, lanes }) => {
                      const minutes = eventMinutes(event.startAt)
                      const duration = Math.max(45, eventMinutes(event.endAt || event.startAt) - minutes)
                      return <article key={event.id} className="mona-agenda-desktop__event" style={{ '--agenda-event-color': getEventColor(event), '--agenda-event-lane': lane, '--agenda-event-lanes': lanes, top: (minutes - firstHour * 60) / 60 * 64, minHeight: Math.max(54, duration / 60 * 64) } as CSSProperties}>
                        <div className="mona-agenda-desktop__event-main"><strong>{event.title}</strong><span>{event.clientName || event.categoryName || event.responsibleUserName || 'Compromisso'}</span></div>
                        <time>{clock(event.startAt)}{event.endAt ? ` – ${clock(event.endAt)}` : ''}</time>
                        <details className="mona-agenda-desktop__event-menu"><summary aria-label={`Detalhes de ${event.title}`}><MoreHorizontal size={18} /></summary><div>
                          <strong>{event.title}</strong>
                          {event.description && <p>{event.description}</p>}
                          {event.responsibleUserName && <p>Responsável: {event.responsibleUserName}</p>}
                          {event.timeZoneId && <p>Fuso: {event.timeZoneId}</p>}
                          {event.clientTimeZoneId && <p>Fuso do cliente: {event.clientTimeZoneId}</p>}
                          {event.kind === 'Meeting' && <p>{event.decisionCount ?? 0} decisões</p>}
                          {!!event.linkedTodos?.length && <p>{event.linkedTodos.length} tarefas vinculadas</p>}
                          {canWrite && <button type="button" onClick={() => void api.post(`/agenda/events/${event.id}/todos`, {}).then(() => qc.invalidateQueries({ queryKey: ['agenda-events'] }))}>Criar follow-up</button>}
                          {canWrite && event.kind === 'Meeting' && <button type="button" onClick={() => {
                            const title = window.prompt('O que ficou combinado?')
                            if (!title?.trim()) return
                            void api.post('/decisions', { title: title.trim(), agendaEventId: event.id, clientId: event.clientId || null, visibleToClient: window.confirm('O cliente pode ver esta decisão no portal?'), createTodo: window.confirm('Abrir uma tarefa a partir desta decisão?') }).then(() => qc.invalidateQueries({ queryKey: ['agenda-events'] }))
                          }}>Registrar decisão</button>}
                        </div></details>
                      </article>
                    })}
                    {dayEvents.length === 0 && <p className="mona-agenda-desktop__empty">Nenhum evento neste dia.</p>}
                  </div>
                </div>}
              </div>
            </div>

            <aside className="mona-agenda-desktop__secondary">
              <section className="mona-agenda-desktop__upcoming">
                <header><CalendarDays size={19} /><h3>Próximos eventos</h3><button type="button" onClick={() => setShowAllDays(true)}>Ver todos</button></header>
                {upcomingEvents.length === 0 ? <p className="mona-agenda-desktop__no-upcoming">Nenhum próximo evento.</p> : upcomingEvents.map((event) => <article key={event.id} className="mona-agenda-desktop__upcoming-row" style={{ '--agenda-event-color': getEventColor(event) } as CSSProperties}>
                  <time>{clock(event.startAt)}<span>{event.endAt ? clock(event.endAt) : ''}</span></time>
                  <div><strong>{event.title}</strong><span>{event.clientName || event.categoryName || 'Compromisso'}</span><small>{event.description || event.responsibleUserName || ''}</small></div>
                </article>)}
              </section>
              <section className="mona-agenda-desktop__summary">
                <header><BarChart3 size={19} /><h3>Resumo da agenda</h3><span>{sameDay(selectedDay, today) ? 'Hoje' : selectedDay.toLocaleDateString('pt-BR')}</span></header>
                <div className="mona-agenda-desktop__metrics">
                  <div><CalendarDays size={18} /><strong>{dayEvents.length}</strong><span>Eventos do dia</span></div>
                  <div><UsersRound size={18} /><strong>{dayEvents.filter((event) => !!event.clientId).length}</strong><span>Com cliente</span></div>
                  <div><Clock3 size={18} /><strong>{durationLabel(meetingMinutes)}</strong><span>Em reuniões</span></div>
                  <div><CheckSquare size={18} /><strong>{linkedTaskCount}</strong><span>Tarefas vinculadas</span></div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </section>

      <div className="mona-phone mona-agenda-calendar mona-m-stack">
        <div className="mona-m-calhead">
          <p className="mona-m-kicker">Sua agenda</p>
          <div className="mona-m-calhead__row">
            <h1 className="mona-m-calhead__month">{monthTitle(selectedDay)}</h1>
            <div className="mona-m-calhead__nav">
              <button type="button" aria-label="Semana anterior" onClick={() => setSelectedDay((day) => shiftDays(day, -7))}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" className="is-today" onClick={() => setSelectedDay(shiftDays(today, 0))}>
                Hoje
              </button>
              <button type="button" aria-label="Próxima semana" onClick={() => setSelectedDay((day) => shiftDays(day, 7))}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
        <div className="mona-m-week">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              className={!showAllDays && sameDay(day, selectedDay) ? 'is-active' : ''}
              aria-pressed={!showAllDays && sameDay(day, selectedDay)} onClick={() => { setSelectedDay(day); setShowAllDays(false) }}
            >
              {day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
              <strong>{day.getDate()}</strong>
              {filteredEvents.some((event) => isSameLocalDay(event.startAt, day)) ? <i /> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="mona-phone">
        <MobileChips>
          {[
            { id: 'individual' as const, label: 'Cores individuais' },
            { id: 'role' as const, label: 'Funcionário vs cliente' },
            { id: 'mine' as const, label: 'Minhas reuniões' },
            ...(canSeeOthers ? [{ id: 'others' as const, label: 'Reuniões alheias' }] : []),
          ].map((v) => (
            <MobileChip key={v.id} active={colorView === v.id} onClick={() => setColorView(v.id)}>{v.label}</MobileChip>
          ))}
        </MobileChips>
      </div>

      {(() => {
        const nextEvent = [...filteredEvents]
          .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
          .find((event) => new Date(event.endAt || event.startAt).getTime() >= Date.now())
        if (!nextEvent) return null
        return (
          <article className="mona-phone mona-m-next">
            <span className="mona-m-next__icon"><CalendarDays size={16} /></span>
            <div>
              <p className="mona-m-kicker">Próxima reunião</p>
              <strong>{nextEvent.clientName || nextEvent.title}</strong>
              <p>{nextEvent.clientName ? nextEvent.title : nextEvent.categoryName || 'Compromisso'} · {clock(nextEvent.startAt)}</p>
            </div>
            <em>{untilLabel(nextEvent.startAt)}</em>
          </article>
        )
      })()}

      <div className="mona-phone mona-m-list">
        <div className="mona-m-dayhead">
          <h2>{showAllDays ? 'Todos os compromissos' : dayHeading(selectedDay, today)}</h2>
          <span>
            {canWrite && <button type="button" className="mona-m-inline" onClick={() => setShowCategory(true)}>Categorias</button>}
            <button type="button" className="mona-m-inline" onClick={() => setShowAllDays((value) => !value)}>{showAllDays ? 'Ver este dia' : 'Ver todos'}</button>
          </span>
        </div>
        {visibleEvents.length === 0 ? (
          <EmptyState title="Nenhum evento na agenda" />
        ) : visibleEvents.map((event) => (
          <article key={event.id} className="mona-m-event" style={{ borderLeftColor: getEventColor(event) }}>
            <time>
              {clock(event.startAt)}
              {event.endAt ? <i>{clock(event.endAt)}</i> : null}
            </time>
            <div>
              <strong>{event.title}</strong>
              <p>
                {[event.clientName, event.description, event.responsibleUserName && `Responsável: ${event.responsibleUserName}`].filter(Boolean).join(' · ')}
              </p>
              <div className="mona-m-tags">
              {canWrite && (
                <button type="button" className="mona-m-inline" onClick={() => void api.post(`/agenda/events/${event.id}/todos`, {}).then(() => qc.invalidateQueries({ queryKey: ['agenda-events'] }))}>
                  + Criar follow-up
                </button>
              )}
              {canWrite && event.kind === 'Meeting' && (
                <button
                  type="button"
                  className="mona-m-inline"
                  onClick={() => {
                    const title = window.prompt('O que ficou combinado?')
                    if (!title?.trim()) return
                    void api.post('/decisions', {
                      title: title.trim(),
                      agendaEventId: event.id,
                      clientId: event.clientId || null,
                      visibleToClient: window.confirm('O cliente pode ver esta decisão no portal?'),
                      createTodo: window.confirm('Abrir uma tarefa a partir desta decisão?'),
                    }).then(() => qc.invalidateQueries({ queryKey: ['agenda-events'] }))
                  }}
                >
                  + Registrar decisão
                </button>
              )}
              </div>
            </div>
            <div className="mona-m-event__tags">
              {event.categoryName ? <span className="mona-m-badge">{event.categoryName}</span> : event.kind === 'Meeting' ? <span className="mona-m-badge">Reunião</span> : null}
            </div>
          </article>
        ))}
        {canWrite && (
          <button type="button" className="mona-m-fab" aria-label="Adicionar evento" onClick={() => setShowEvent(true)}>
            <Plus size={22} />
          </button>
        )}
      </div>

      </div>

      <Modal open={showEvent} onClose={closeEvent} title="Novo evento">
        <div className="space-y-4">
          <Input label="Título" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          <Input label="Início (no fuso do evento)" type="datetime-local" value={eventForm.startAt} onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })} />
          <Input label="Fim" type="datetime-local" value={eventForm.endAt} onChange={(e) => setEventForm({ ...eventForm, endAt: e.target.value })} />
          <Select
            label="Fuso do evento / cliente"
            value={eventForm.timeZoneId}
            onChange={(e) => setEventForm({ ...eventForm, timeZoneId: e.target.value })}
          >
            {(timezones.length ? timezones : [{ id: 'America/Sao_Paulo', label: 'America/Sao_Paulo' }, { id: 'America/New_York', label: 'America/New_York' }]).map((z) => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </Select>
          <Input
            label="Lembrete (minutos antes)"
            type="number"
            value={eventForm.remindMinutesBefore}
            onChange={(e) => setEventForm({ ...eventForm, remindMinutesBefore: e.target.value })}
          />
          <Select label="Tipo" value={eventForm.kind} onChange={(e) => setEventForm({ ...eventForm, kind: e.target.value })}>
            <option value="Event">Compromisso</option>
            <option value="Meeting">Reunião (gera decisões)</option>
            <option value="Block">Bloqueio</option>
          </Select>
          <Select label="Categoria" value={eventForm.categoryId} onChange={(e) => setEventForm({ ...eventForm, categoryId: e.target.value })}>
            <option value="">— Nenhuma —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Textarea label="Descrição" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          <p className="text-xs text-ink-500">
            14:00 em America/New_York não é 14:00 em America/Sao_Paulo. O sistema grava UTC e mostra no seu fuso e no fuso do evento.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeEvent}>Cancelar</Button>
            <Button disabled={!eventForm.title || !eventForm.startAt} onClick={() => eventMutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCategory} onClose={() => setShowCategory(false)} title="Categorias">
        <div className="space-y-4">
          <ul className="space-y-2">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-sand-50 px-3 py-2">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                {canWrite && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => deleteCategoryMutation.mutate(c.id)}
                  >
                    Excluir
                  </button>
                )}
              </li>
            ))}
          </ul>
          <Input label="Nome" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          <Input label="Cor" type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })} />
          <Button disabled={!categoryForm.name} onClick={() => categoryMutation.mutate()}>Adicionar categoria</Button>
        </div>
      </Modal>
    </div>
  )
}
