import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { api } from '../../shared/api/client'
import type { AgendaCategory, AgendaEvent } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useAuth } from '../../shared/auth/AuthContext'
import { useTimeZones, useUserPreferences } from '../../shared/hooks/useWorkspaceData'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../../shared/ui'

type ColorView = 'individual' | 'role' | 'mine' | 'others'

export function AgendaPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.AgendaWrite)
  const canSeeOthers = hasPermission(Permissions.AgendaOthers)
  const qc = useQueryClient()

  const [colorView, setColorView] = useState<ColorView>('individual')
  const [showEvent, setShowEvent] = useState(false)
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
  })
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#006D69' })

  const displayTz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId
  const { data: events = [], isLoading } = useQuery({
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
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['agenda-events'] })
      setShowEvent(false)
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

  if (isLoading) return <LoadingSpinner />

  const groupedByDate = filteredEvents.reduce<Record<string, AgendaEvent[]>>((acc, e) => {
    const date = new Date(e.startAt).toLocaleDateString('pt-BR')
    acc[date] = acc[date] || []
    acc[date].push(e)
    return acc
  }, {})

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle={`Exibição no fuso efetivo: ${displayTz || 'America/Sao_Paulo'} (casa ou viagem). Eventos em UTC + fuso do cliente. Tarefas vinculadas são follow-ups, não o compromisso.`}
        actions={
          <div className="flex gap-2">
            {canWrite && (
              <Button variant="secondary" onClick={() => setShowCategory(true)}>
                Categorias
              </Button>
            )}
            {canWrite && (
              <Button onClick={() => setShowEvent(true)}>Adicionar evento</Button>
            )}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: 'individual' as const, label: 'Cores individuais' },
          { id: 'role' as const, label: 'Funcionário vs cliente' },
          { id: 'mine' as const, label: 'Minhas reuniões' },
          ...(canSeeOthers ? [{ id: 'others' as const, label: 'Reuniões alheias' }] : []),
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setColorView(v.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              colorView === v.id ? 'bg-teal-900 text-white' : 'bg-white text-teal-800'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {Object.keys(groupedByDate).length === 0 ? (
        <EmptyState title="Nenhum evento na agenda" />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, dayEvents]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-teal-700">
                {date}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="border-l-4 py-3"
                    style={{ borderLeftColor: getEventColor(event) }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-teal-900">{event.title}</p>
                        <p className="text-sm text-teal-700">
                          {new Date(event.startAt).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {event.endAt &&
                            ` — ${new Date(event.endAt).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                          <span className="ml-1 text-xs text-ink-500">
                            ({event.displayTimeZoneId || preferences?.timeZoneId})
                          </span>
                        </p>
                        {event.timeZoneId && event.timeZoneId !== event.displayTimeZoneId && (
                          <p className="text-xs text-brand-800">
                            No fuso do evento ({event.timeZoneId}):{' '}
                            {event.startAtEventLocal
                              ? new Date(event.startAtEventLocal).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </p>
                        )}
                        {event.responsibleUserName && (
                          <p className="text-xs text-teal-600">Responsável: {event.responsibleUserName}</p>
                        )}
                        {event.clientName && (
                          <p className="text-xs text-teal-600">
                            Cliente: {event.clientName}
                            {event.clientTimeZoneId ? ` · ${event.clientTimeZoneId}` : ''}
                          </p>
                        )}
                        {!!event.linkedTodos?.length && (
                          <p className="text-xs text-ink-500">
                            {event.linkedTodos.length} tarefa(s) vinculada(s)
                          </p>
                        )}
                        {canWrite && (
                          <button
                            type="button"
                            className="mt-1 text-xs font-medium text-brand-800 hover:underline"
                            onClick={() =>
                              void api.post(`/agenda/events/${event.id}/todos`, {}).then(() =>
                                qc.invalidateQueries({ queryKey: ['agenda-events'] }),
                              )
                            }
                          >
                            + Criar follow-up (tarefa)
                          </button>
                        )}
                      </div>
                      {event.categoryName && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: event.categoryColor || '#0F4C5C' }}
                        >
                          {event.categoryName}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-teal-700/90">{event.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showEvent} onClose={() => setShowEvent(false)} title="Novo evento">
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
            <Button variant="secondary" onClick={() => setShowEvent(false)}>Cancelar</Button>
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
