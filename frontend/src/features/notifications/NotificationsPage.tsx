import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { Button, Card, EmptyState, LoadingSpinner, PageHeader } from '../../shared/ui'

type Notif = {
  id: string
  title: string
  body: string
  link?: string
  type: string
  priority?: string
  isRead: boolean
  resolutionStatus?: string | null
  occursAtLocal: string
  timeZoneId: string
  isOpen?: boolean
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'open' | 'all' | 'resolved'>('open')

  const { data = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notif[]>('/notifications'),
    refetchInterval: 20_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.post(`/notifications/${id}/resolve`, { status }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const filtered = useMemo(() => {
    if (filter === 'open') return data.filter((n) => !n.resolutionStatus)
    if (filter === 'resolved') return data.filter((n) => !!n.resolutionStatus)
    return data
  }, [data, filter])

  const openCount = data.filter((n) => !n.resolutionStatus).length
  const unread = data.filter((n) => !n.isRead).length

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Central de alertas"
        subtitle={`${openCount} em aberto · ${unread} não visualizadas. Marque como vista e depois como resolvida (antes / na hora / atrasado).`}
        actions={
          <Button variant="secondary" onClick={() => markAll.mutate()}>
            Marcar todas como vistas
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ['open', 'Em aberto'],
            ['all', 'Todas'],
            ['resolved', 'Resolvidas'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-sm ${
              filter === id ? 'bg-brand-800 text-white' : 'bg-white text-ink-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum alerta neste filtro" />
      ) : (
        <ul className="space-y-3">
          {filtered.map((n) => (
            <Card key={n.id} className={!n.isRead ? 'border-brand-200 bg-brand-50/30' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-900">{n.title}</p>
                  <p className="mt-1 text-sm text-ink-600">{n.body}</p>
                  <p className="mt-2 text-xs text-ink-500">
                    {new Date(n.occursAtLocal).toLocaleString('pt-BR')} · {n.timeZoneId} · {n.type}
                    {n.priority ? ` · ${n.priority}` : ''}
                    {n.resolutionStatus ? ` · resolvido: ${n.resolutionStatus}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!n.isRead && (
                    <Button size="sm" variant="secondary" onClick={() => markRead.mutate(n.id)}>
                      Vista
                    </Button>
                  )}
                  {n.link && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(n.link!)}>
                      Abrir
                    </Button>
                  )}
                </div>
              </div>
              {!n.resolutionStatus && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                  <span className="text-xs text-ink-500">Resolver como:</span>
                  <Button size="sm" variant="secondary" onClick={() => resolve.mutate({ id: n.id, status: 'Early' })}>
                    Antes do prazo
                  </Button>
                  <Button size="sm" onClick={() => resolve.mutate({ id: n.id, status: 'OnTime' })}>
                    Na hora
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve.mutate({ id: n.id, status: 'Late' })}>
                    Atrasado
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
