import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import type { ChecklistTemplate, OnboardingClient } from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import {
  Button,
  Card,
  Checkbox,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
} from '../../shared/ui'

export function OnboardingPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.OnboardingWrite)
  const qc = useQueryClient()
  const [showTemplates, setShowTemplates] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateItems, setNewTemplateItems] = useState('')

  const {
    data: clients = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => api.get<OnboardingClient[]>('/onboarding/incomplete'),
  })

  const { data: templates = [] } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: () => api.get<ChecklistTemplate[]>('/checklist-templates'),
    enabled: showTemplates,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ clientId, itemId, isCompleted }: { clientId: string; itemId: string; isCompleted: boolean }) =>
      api.patch(`/onboarding/${clientId}/items/${itemId}`, { isCompleted }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['onboarding'] }),
  })

  const applyTemplateMutation = useMutation({
    mutationFn: ({ clientId, templateId }: { clientId: string; templateId: string }) =>
      api.post(`/onboarding/${clientId}/apply-template`, { templateId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['onboarding'] }),
  })

  const createTemplateMutation = useMutation({
    mutationFn: () =>
      api.post('/checklist-templates', {
        name: newTemplateName,
        items: newTemplateItems.split('\n').filter(Boolean),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['checklist-templates'] })
      setNewTemplateName('')
      setNewTemplateItems('')
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="min-w-0">
      <PageHeader
        title="Onboarding"
        subtitle="Clientes com onboarding incompleto"
        actions={
          canWrite && (
            <Button variant="secondary" onClick={() => setShowTemplates(true)}>
              Adicionar checklist padrão
            </Button>
          )
        }
      />

      {isError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Não foi possível carregar o onboarding ({(error as Error)?.message || 'erro'}).
          <button type="button" className="ml-2 font-medium underline" onClick={() => void refetch()}>
            Tentar de novo
          </button>
        </div>
      )}

      {!isError && clients.length === 0 ? (
        <EmptyState title="Todos os clientes concluíram o onboarding" />
      ) : clients.length > 0 ? (
        <div className="space-y-6">
          {clients.map((client) => (
            <Card key={client.clientId}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link
                    to={`/clientes/${client.clientId}`}
                    className="text-lg font-semibold text-teal-900 hover:underline brand-font"
                  >
                    {client.clientName}
                  </Link>
                  <p className="text-sm text-teal-700">
                    {client.completedCount}/{client.totalCount} etapas concluídas
                  </p>
                </div>
                <div className="h-2 w-32 overflow-hidden rounded-full bg-sand-200">
                  <div
                    className="h-full bg-teal-600 transition-all"
                    style={{
                      width: `${client.totalCount ? (client.completedCount / client.totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <ul className="space-y-2">
                {client.items.map((item) => (
                  <li key={item.id}>
                    <Checkbox
                      label={item.title}
                      checked={item.isCompleted}
                      disabled={!canWrite}
                      onChange={(e) =>
                        toggleMutation.mutate({
                          clientId: client.clientId,
                          itemId: item.id,
                          isCompleted: e.target.checked,
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      ) : null}

      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="Checklists padrão" size="lg">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 font-medium text-teal-900">Templates existentes</h3>
            {templates.length === 0 ? (
              <p className="text-sm text-teal-700/70">Nenhum template cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {templates.map((t) => (
                  <li key={t.id} className="rounded-lg bg-sand-50 p-3 text-sm">
                    <p className="font-medium">{t.name}</p>
                    <ul className="mt-1 list-inside list-disc text-teal-700">
                      {t.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    {clients.length > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() =>
                          applyTemplateMutation.mutate({
                            clientId: clients[0].clientId,
                            templateId: t.id,
                          })
                        }
                      >
                        Aplicar ao primeiro cliente
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-sand-200 pt-4">
            <h3 className="mb-2 font-medium text-teal-900">+ Novo template</h3>
            <div className="space-y-3">
              <Input
                label="Nome"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <div>
                <label className="text-sm font-medium text-teal-900">Itens (um por linha)</label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-sand-300 px-3 py-2 text-sm"
                  rows={4}
                  value={newTemplateItems}
                  onChange={(e) => setNewTemplateItems(e.target.value)}
                />
              </div>
              <Button
                disabled={!newTemplateName || createTemplateMutation.isPending}
                onClick={() => createTemplateMutation.mutate()}
              >
                Criar template
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
