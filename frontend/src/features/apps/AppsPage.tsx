import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppWindow } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { AppItem } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  EmptyState,
  Input,
  LoadingSpinner,
  MobileHero,
  MobileSection,
  MobileTip,
  Modal,
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
    <div className="mona-m-stack">
      <MobileHero
        kicker="Apps"
        title="Ferramentas do dia a dia"
        lead="Acesse os aplicativos que a equipe usa no trabalho, em um só lugar."
        note="Menos abas, mais foco"
      />

      {canWrite && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAdd(true)}>Adicionar app</Button>
        </div>
      )}

      {apps.length === 0 ? (
        <EmptyState title="Nenhum app cadastrado" />
      ) : (
        <MobileSection title="Seus apps">
          <div className={`mona-m-apps${apps.length >= 4 ? ' is-4' : apps.length === 2 ? ' is-2' : ''}`}>
            {apps.map((app) => (
              <a
                key={app.id}
                href={app.homeUrl || app.downloadUrl || '#'}
                target={app.homeUrl || app.downloadUrl ? '_blank' : undefined}
                rel={app.homeUrl || app.downloadUrl ? 'noreferrer' : undefined}
                className="mona-m-app"
              >
                <span className="mona-m-icon">
                  <AppWindow size={16} strokeWidth={1.8} />
                </span>
                <strong>{app.name}</strong>
                <p>{app.homeUrl ? 'Abrir app' : app.downloadUrl ? 'Download' : 'App cadastrado'}</p>
              </a>
            ))}
          </div>
        </MobileSection>
      )}

      <MobileTip to="/configuracoes">Organize integrações e acessos em Configurações quando precisar.</MobileTip>

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
