import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, PlayCircle, Sparkles } from 'lucide-react'
import { api } from '../../shared/api/client'
import type { ChecklistTemplate, Client, Employee, OnboardingClient, Organization, ServiceItem } from '../../shared/types'
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
  Select,
  Textarea,
} from '../../shared/ui'

const serviceOptions = [
  { key: 'inbox', label: 'Inbox e triagem', defaultSla: 30 },
  { key: 'agenda', label: 'Agenda e remarcações', defaultSla: 60 },
  { key: 'atendimento', label: 'Atendimento / front office', defaultSla: 10 },
  { key: 'crm', label: 'CRM e follow-up comercial', defaultSla: 120 },
  { key: 'financeiro', label: 'Financeiro administrativo', defaultSla: 240 },
  { key: 'operacoes', label: 'Operações recorrentes', defaultSla: 180 },
] as const

const verticalTemplates = [
  {
    key: 'clinica',
    label: 'Clínica / saúde',
    rules: 'Validar identidade antes de tratar informações sensíveis. Escalar urgências clínicas imediatamente. Nunca prometer conduta médica.',
    workflow: 'Mensagem de paciente -> identificar assunto -> validar dados -> aplicar política -> confirmar próximo passo -> registrar evidência',
  },
  {
    key: 'real-estate',
    label: 'Real estate',
    rules: 'Confirmar imóvel, etapa da transação e partes envolvidas. Escalar prazos contratuais e documentação incompleta.',
    workflow: 'Lead ou parte interessada -> classificar imóvel/etapa -> checar disponibilidade -> criar follow-up -> atualizar CRM',
  },
  {
    key: 'home-services',
    label: 'Home services',
    rules: 'Priorizar pedidos com urgência operacional, janela de atendimento e localização. Confirmar disponibilidade antes de prometer horário.',
    workflow: 'Pedido de orçamento -> capturar serviço/local/data -> checar agenda -> atribuir retorno -> avisar equipe',
  },
  {
    key: 'creator',
    label: 'Creator / consultoria',
    rules: 'Proteger agenda do fundador, manter tom de voz e priorizar oportunidades ligadas a receita, lançamento ou cliente ativo.',
    workflow: 'Mensagem ou e-mail -> classificar oportunidade -> preparar resposta -> criar tarefa -> registrar decisão',
  },
  {
    key: 'juridico',
    label: 'Jurídico',
    rules: 'Não dar aconselhamento jurídico. Checar conflito, confidencialidade e prazos antes de encaminhar qualquer resposta.',
    workflow: 'Intake -> registrar tipo de caso -> coletar dados mínimos -> escalar advogado/responsável -> registrar follow-up',
  },
  {
    key: 'marketing',
    label: 'Agência de marketing',
    rules: 'Separar aprovações por cliente/canal. Não publicar sem aprovação quando houver alteração de escopo, verba ou tom.',
    workflow: 'Pedido do cliente -> classificar campanha/canal -> criar entregável -> pedir aprovação -> registrar evidência',
  },
] as const

type GuidedSetupForm = {
  agencyName: string
  clientMode: 'existing' | 'new'
  clientId: string
  clientName: string
  companyName: string
  serviceKey: string
  verticalKey: string
  assistantUserId: string
  channels: string[]
  slaMinutes: string
  sopRules: string
  workflowName: string
  messageExample: string
}

function buildChecklistItems(form: GuidedSetupForm, serviceLabel: string, verticalLabel: string) {
  const channels = form.channels.length ? form.channels.join(', ') : 'canais principais'
  return [
    `Criar workspace do cliente com segmento ${verticalLabel}`,
    `Confirmar serviço principal: ${serviceLabel}`,
    `Definir canais monitorados: ${channels}`,
    `Registrar SLA inicial: ${form.slaMinutes || '30'} min para primeira resposta`,
    'Cadastrar contatos, preferências e árvore de escalonamento',
    'Cadastrar SOPs e regras essenciais do cliente',
    `Criar workflow inicial: ${form.workflowName || 'Mensagem vira demanda operacional'}`,
    'Simular mensagem recebida e validar criação de tarefa',
    'Revisar relatório de valor: SLA, pendências e evidências',
  ]
}

export function OnboardingPage() {
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.OnboardingWrite)
  const canUpdateSettings = hasPermission(Permissions.Settings)
  const canCreateClient = hasPermission(Permissions.ClientsWrite)
  const canReadClients = hasPermission(Permissions.ClientsRead)
  const canWriteServices = hasPermission(Permissions.ServicesWrite)
  const canReadServices = hasPermission(Permissions.ServicesRead)
  const canReadEmployees = hasPermission(Permissions.EmployeesRead)
  const canWriteTodos = hasPermission(Permissions.TodosWrite)
  const qc = useQueryClient()
  const [showTemplates, setShowTemplates] = useState(false)
  const [showGuidedSetup, setShowGuidedSetup] = useState(false)
  const [setupResult, setSetupResult] = useState<string | null>(null)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateItems, setNewTemplateItems] = useState('')
  const [guidedForm, setGuidedForm] = useState<GuidedSetupForm>({
    agencyName: '',
    clientMode: 'new',
    clientId: '',
    clientName: '',
    companyName: '',
    serviceKey: 'atendimento',
    verticalKey: 'home-services',
    assistantUserId: '',
    channels: ['WhatsApp', 'E-mail'],
    slaMinutes: '10',
    sopRules: verticalTemplates[2].rules,
    workflowName: verticalTemplates[2].workflow,
    messageExample: 'Oi, quero orçamento para sábado de manhã. Vocês atendem minha região?',
  })

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

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get<Organization>('/organizations/me'),
    enabled: showGuidedSetup,
  })

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: showGuidedSetup && canReadClients,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/employees'),
    enabled: showGuidedSetup && canReadEmployees,
  })

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<ServiceItem[]>('/services'),
    enabled: showGuidedSetup && canReadServices,
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

  const guidedSetupMutation = useMutation({
    mutationFn: async () => {
      const service = serviceOptions.find((item) => item.key === guidedForm.serviceKey) ?? serviceOptions[0]
      const vertical = verticalTemplates.find((item) => item.key === guidedForm.verticalKey) ?? verticalTemplates[0]
      let clientId = guidedForm.clientId

      if (canUpdateSettings && guidedForm.agencyName.trim() && guidedForm.agencyName.trim() !== organization?.name) {
        await api.patch('/organizations/me', {
          name: guidedForm.agencyName.trim(),
          document: organization?.document,
          phone: organization?.phone,
          email: organization?.email,
          address: organization?.address,
          whatsAppSupportUrl: organization?.whatsAppSupportUrl,
        })
      }

      if (guidedForm.clientMode === 'new') {
        const client = await api.post<Client>('/clients', {
          name: guidedForm.clientName.trim(),
          companyName: guidedForm.companyName.trim() || guidedForm.clientName.trim(),
          phone: '',
          email: '',
          crmNotes: '',
          segment: vertical.label,
          tags: [service.label, vertical.label],
          preferredLanguage: 'pt-BR',
          marketCountry: 'US',
          needsQuickResponse: Number(guidedForm.slaMinutes || service.defaultSla) <= 30,
          serviceWorkNotes: `${service.label} | SLA ${guidedForm.slaMinutes || service.defaultSla} min | canais: ${guidedForm.channels.join(', ')}`,
          additionalNotes: `Regras iniciais: ${guidedForm.sopRules}`,
          timeZoneId: 'America/Sao_Paulo',
          retainerHoursPerMonth: 0,
        })
        clientId = client.id
      }

      let serviceId = services.find((item) => item.title.toLowerCase() === service.label.toLowerCase())?.id
      if (!serviceId && canWriteServices) {
        const created = await api.post<ServiceItem>('/services', {
          title: service.label,
          description: `Serviço configurado no setup guiado do MONA para ${vertical.label}.`,
          category: vertical.label,
          specificities: guidedForm.channels,
          assistantNotes: guidedForm.sopRules,
          clientFacingNotes: `Primeira resposta em até ${guidedForm.slaMinutes || service.defaultSla} min nos canais combinados.`,
          isActive: true,
        })
        serviceId = created.id
      }

      if (serviceId && clientId && canWriteServices) {
        await api.post(`/services/${serviceId}/assign-client`, {
          clientId,
          status: 'Active',
          assignedAssistantUserId: null,
          customNotes: `${guidedForm.workflowName}${guidedForm.assistantUserId ? ` | Prestador sugerido: ${employees.find((employee) => employee.id === guidedForm.assistantUserId)?.name ?? 'selecionado'}` : ''}`,
        })
      }

      const checklist = await api.post<ChecklistTemplate>('/checklist-templates', {
        name: `Setup operacional - ${vertical.label} - ${service.label}`,
        items: buildChecklistItems(guidedForm, service.label, vertical.label),
      })

      if (clientId) {
        await api.post(`/onboarding/${clientId}/apply-template`, { templateId: checklist.id })
      }

      if (clientId && canWriteTodos) {
        await api.post('/todos', {
          title: `Simulação: transformar mensagem em demanda (${service.label})`,
          description: [
            `Mensagem recebida: "${guidedForm.messageExample}"`,
            `Cliente/contexto: ${vertical.label}`,
            `Próxima ação: aplicar workflow "${guidedForm.workflowName}" e registrar evidência.`,
            `SLA: ${guidedForm.slaMinutes || service.defaultSla} min.`,
          ].join('\n'),
          isGeneral: true,
          clientId,
          priority: Number(guidedForm.slaMinutes || service.defaultSla) <= 30 ? 'High' : 'Normal',
          tags: ['setup-mona', service.label, vertical.label],
        })
      }

      return { clientId, serviceLabel: service.label, verticalLabel: vertical.label }
    },
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: ['onboarding'] })
      void qc.invalidateQueries({ queryKey: ['checklist-templates'] })
      void qc.invalidateQueries({ queryKey: ['clients'] })
      void qc.invalidateQueries({ queryKey: ['services'] })
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['organization'] })
      setSetupResult(`Operação criada para ${result.verticalLabel}: ${result.serviceLabel}. Checklist, serviço e simulação foram preparados.`)
      setShowGuidedSetup(false)
    },
  })

  function openGuidedSetup() {
    setGuidedForm((current) => ({
      ...current,
      agencyName: current.agencyName || organization?.name || '',
      clientId: current.clientId || allClients[0]?.id || '',
    }))
    setShowGuidedSetup(true)
  }

  function toggleChannel(channel: string) {
    setGuidedForm((current) => ({
      ...current,
      channels: current.channels.includes(channel)
        ? current.channels.filter((item) => item !== channel)
        : [...current.channels, channel],
    }))
  }

  function applyVerticalTemplate(key: string) {
    const vertical = verticalTemplates.find((item) => item.key === key) ?? verticalTemplates[0]
    setGuidedForm((current) => ({
      ...current,
      verticalKey: key,
      sopRules: vertical.rules,
      workflowName: vertical.workflow,
    }))
  }

  function applyService(key: string) {
    const service = serviceOptions.find((item) => item.key === key) ?? serviceOptions[0]
    setGuidedForm((current) => ({
      ...current,
      serviceKey: key,
      slaMinutes: String(service.defaultSla),
    }))
  }

  const selectedService = serviceOptions.find((item) => item.key === guidedForm.serviceKey) ?? serviceOptions[0]
  const selectedVertical = verticalTemplates.find((item) => item.key === guidedForm.verticalKey) ?? verticalTemplates[0]
  const setupCanSubmit =
    canWrite &&
    (guidedForm.clientMode === 'existing'
      ? Boolean(guidedForm.clientId)
      : canCreateClient && Boolean(guidedForm.clientName.trim()))

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="min-w-0">
      <PageHeader
        title="Onboarding"
        subtitle="Setup operacional guiado para tirar uma agência de AVs do zero até uma operação real configurada."
        actions={
          canWrite && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setShowTemplates(true)}>
                <ClipboardCheck size={14} /> Checklists
              </Button>
              <Button onClick={openGuidedSetup}>
                <Sparkles size={14} /> Setup guiado
              </Button>
            </div>
          )
        }
      />

      {setupResult && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{setupResult}</span>
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {[
          ['1', 'Configurar', 'Agência, cliente, serviço, vertical e responsável.'],
          ['2', 'Operar', 'Canais, SLA, SOPs e workflow ficam prontos para execução.'],
          ['3', 'Provar valor', 'A primeira mensagem simulada vira tarefa rastreável.'],
        ].map(([step, title, body]) => (
          <div key={step} className="rounded-xl border border-ink-100 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-900 text-xs font-semibold text-white">
                {step}
              </span>
              <p className="font-semibold text-ink-900">{title}</p>
            </div>
            <p className="text-sm text-ink-600">{body}</p>
          </div>
        ))}
      </div>

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

      <Modal open={showGuidedSetup} onClose={() => setShowGuidedSetup(false)} title="Setup operacional guiado" size="lg">
        <div className="space-y-6">
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
            <div className="flex items-start gap-3">
              <PlayCircle size={22} className="mt-0.5 shrink-0 text-teal-800" />
              <div>
                <p className="font-semibold text-teal-950">Tutorial que configura operação, não botões.</p>
                <p className="mt-1 text-sm text-teal-800">
                  Ao finalizar, o MONA cria/aplica checklist, serviço, vínculo com cliente e uma primeira demanda simulada para testar o fluxo de AV.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Nome da agência"
              value={guidedForm.agencyName || organization?.name || ''}
              onChange={(e) => setGuidedForm({ ...guidedForm, agencyName: e.target.value })}
              placeholder="Mona Assistants"
            />
            <Select
              label="Cliente"
              value={guidedForm.clientMode}
              onChange={(e) => setGuidedForm({ ...guidedForm, clientMode: e.target.value as GuidedSetupForm['clientMode'] })}
            >
              <option value="new" disabled={!canCreateClient}>
                Criar novo cliente
              </option>
              <option value="existing">Usar cliente existente</option>
            </Select>
          </div>

          {guidedForm.clientMode === 'new' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nome do cliente"
                value={guidedForm.clientName}
                onChange={(e) => setGuidedForm({ ...guidedForm, clientName: e.target.value })}
                placeholder="Bright Home Services"
              />
              <Input
                label="Empresa / marca"
                value={guidedForm.companyName}
                onChange={(e) => setGuidedForm({ ...guidedForm, companyName: e.target.value })}
                placeholder="Bright Home Services LLC"
              />
            </div>
          ) : (
            <Select
              label="Selecionar cliente"
              value={guidedForm.clientId}
              onChange={(e) => setGuidedForm({ ...guidedForm, clientId: e.target.value })}
            >
              <option value="">Escolha um cliente</option>
              {allClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Select label="Serviço principal" value={guidedForm.serviceKey} onChange={(e) => applyService(e.target.value)}>
              {serviceOptions.map((service) => (
                <option key={service.key} value={service.key}>
                  {service.label}
                </option>
              ))}
            </Select>
            <Select label="Template vertical" value={guidedForm.verticalKey} onChange={(e) => applyVerticalTemplate(e.target.value)}>
              {verticalTemplates.map((vertical) => (
                <option key={vertical.key} value={vertical.key}>
                  {vertical.label}
                </option>
              ))}
            </Select>
            <Select
              label="Assistente responsável"
              value={guidedForm.assistantUserId}
              onChange={(e) => setGuidedForm({ ...guidedForm, assistantUserId: e.target.value })}
            >
              <option value="">Definir depois</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-ink-900">Canais monitorados</p>
            <div className="flex flex-wrap gap-2">
              {['WhatsApp', 'E-mail', 'Telefone', 'Portal', 'Slack/Teams'].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    guidedForm.channels.includes(channel)
                      ? 'border-teal-700 bg-teal-900 text-white'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-teal-300'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <Input
              label="SLA primeira resposta (min)"
              type="number"
              min="1"
              value={guidedForm.slaMinutes}
              onChange={(e) => setGuidedForm({ ...guidedForm, slaMinutes: e.target.value })}
            />
            <Textarea
              label="SOPs / regras essenciais"
              value={guidedForm.sopRules}
              onChange={(e) => setGuidedForm({ ...guidedForm, sopRules: e.target.value })}
              rows={3}
            />
          </div>

          <Textarea
            label="Primeiro workflow"
            value={guidedForm.workflowName}
            onChange={(e) => setGuidedForm({ ...guidedForm, workflowName: e.target.value })}
            rows={2}
          />

          <Textarea
            label="Mensagem simulada"
            value={guidedForm.messageExample}
            onChange={(e) => setGuidedForm({ ...guidedForm, messageExample: e.target.value })}
            rows={2}
          />

          <div className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-sm font-semibold text-ink-900">Prévia do relatório de valor</p>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs uppercase text-ink-500">Cliente</p>
                <p className="text-sm font-medium text-ink-900">
                  {guidedForm.clientMode === 'existing'
                    ? allClients.find((client) => client.id === guidedForm.clientId)?.name || 'Cliente existente'
                    : guidedForm.clientName || 'Novo cliente'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-500">Serviço</p>
                <p className="text-sm font-medium text-ink-900">{selectedService.label}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-500">Vertical</p>
                <p className="text-sm font-medium text-ink-900">{selectedVertical.label}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-500">SLA</p>
                <p className="text-sm font-medium text-ink-900">{guidedForm.slaMinutes || selectedService.defaultSla} min</p>
              </div>
            </div>
          </div>

          {!setupCanSubmit && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Para concluir, selecione/crie um cliente válido. Criar novo cliente exige permissão de escrita em Clientes.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowGuidedSetup(false)}>
              Cancelar
            </Button>
            <Button disabled={!setupCanSubmit || guidedSetupMutation.isPending} onClick={() => guidedSetupMutation.mutate()}>
              {guidedSetupMutation.isPending ? 'Configurando…' : 'Configurar operação'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
