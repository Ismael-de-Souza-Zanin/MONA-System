import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../shared/api/client'
import type { AppItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
} from '../../shared/ui'

export function AppsPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.AppsWrite)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', homeUrl: '', downloadUrl: '' })
  const qc = useQueryClient()

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['apps'],
    queryFn: () => api.get<AppItem[]>('/apps'),
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/apps', form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['apps'] })
      setShowAdd(false)
      setForm({ name: '', homeUrl: '', downloadUrl: '' })
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader
        title="Apps"
        subtitle="Aplicativos utilizados no trabalho"
        actions={canWrite && <Button onClick={() => setShowAdd(true)}>Adicionar app</Button>}
      />

      {apps.length === 0 ? (
        <EmptyState title="Nenhum app cadastrado" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <h3 className="font-semibold text-teal-900">{app.name}</h3>
              <div className="mt-3 space-y-1 text-sm">
                {app.homeUrl && (
                  <a href={app.homeUrl} target="_blank" rel="noreferrer" className="block text-teal-700 hover:underline">
                    Página inicial →
                  </a>
                )}
                {app.downloadUrl && (
                  <a href={app.downloadUrl} target="_blank" rel="noreferrer" className="block text-teal-700 hover:underline">
                    Download →
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Novo app">
        <div className="space-y-4">
          <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="URL página inicial" value={form.homeUrl} onChange={(e) => setForm({ ...form, homeUrl: e.target.value })} />
          <Input label="URL download" value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button disabled={!form.name || mutation.isPending} onClick={() => mutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
