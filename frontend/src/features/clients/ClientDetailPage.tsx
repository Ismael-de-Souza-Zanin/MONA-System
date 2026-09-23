import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AppWindow,
  CalendarDays,
  CheckSquare,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react'
import { api } from '../../shared/api/client'
import type {
  ClientDetail,
  ClientPartnerLink,
  Employee,
  Partner,
  PaymentLink,
  SharedUser,
} from '../../shared/types'
import { Permissions } from '../../shared/permissions/constants'
import { usePermissions } from '../../shared/permissions/hooks'
import { useTimeZones } from '../../shared/hooks/useWorkspaceData'
import { useWorkspaceTabs } from '../../app/WorkspaceTabsContext'
import { SettlePaymentModal } from '../finance/SettlePaymentModal'
import {
  EntityLinksField,
  PaymentLinksChips,
  linksToApi,
} from '../finance/EntityLinksField'
import {
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  MobileAvatar,
  MobileProgress,
  MobileRow,
  MobileTip,
  StatusBadge,
  Textarea,
} from '../../shared/ui'

type TabId =
  | 'resumo'
  | 'equipe'
  | 'apps'
  | 'acessos'
  | 'crm'
  | 'portal'
  | 'financeiro'
  | 'contrato'
  | 'invoices'
  | 'servicos'
  | 'parceiros'

const TABS: { id: TabId; label: string }[] = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'equipe', label: 'Equipe' },
  { id: 'apps', label: 'Aplicativos' },
  { id: 'acessos', label: 'Acessos' },
  { id: 'crm', label: 'CRM' },
  { id: 'portal', label: 'Portal' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'parceiros', label: 'Parceiros' },
]

function money(value?: number) {
  return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

type ClientTeamRow = {
  key: string
  name: string
  email?: string
  color?: string
  employeeId?: string
  user?: SharedUser
  atende: boolean
  podeEntrar: boolean
}

function buildClientTeamRows(
  responsibles: { id: string; name: string; color?: string; email?: string }[] | undefined,
  sharedUsers: SharedUser[],
  clientId: string,
  includeLogins: boolean,
): ClientTeamRow[] {
  const rows = new Map<string, ClientTeamRow>()
  const emailKey = (email?: string, fallback?: string) => (email || fallback || '').toLowerCase()

  for (const r of responsibles ?? []) {
    const key = emailKey(r.email, r.id)
    rows.set(key, {
      key,
      name: r.name,
      email: r.email,
      color: r.color,
      employeeId: r.id,
      atende: true,
      podeEntrar: false,
    })
  }

  if (includeLogins) {
    for (const u of sharedUsers) {
      const hasAccess = !!u.isOwner || u.assignedClientIds.includes(clientId)
      const key = emailKey(u.email, u.id)
      const existing = rows.get(key)
      if (existing) {
        if (hasAccess) {
          existing.podeEntrar = true
          existing.user = u
        } else if (!existing.user) {
          existing.user = u
        }
        continue
      }
      if (!hasAccess) continue
      rows.set(key, {
        key,
        name: u.name,
        email: u.email,
        user: u,
        atende: false,
        podeEntrar: true,
      })
    }
  }

  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { hasPermission } = usePermissions()
  const canWrite = hasPermission(Permissions.ClientsWrite)
  const canFinance = hasPermission(Permissions.FinanceAll)
  const canTodos = hasPermission(Permissions.TodosWrite)
  const canContracts = hasPermission(Permissions.ContractsWrite)
  const canPartners = hasPermission(Permissions.PartnersWrite)
  const canEmployees = hasPermission(Permissions.EmployeesWrite)
  const canSettings = hasPermission(Permissions.Settings)
  const { renameTab } = useWorkspaceTabs()
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabId>('resumo')
  const [showEdit, setShowEdit] = useState(false)
  const [showTopic, setShowTopic] = useState(false)
  const [showCred, setShowCred] = useState(false)
  const [showApp, setShowApp] = useState(false)
  const [showInvoice, setShowInvoice] = useState(false)
  const [showTodo, setShowTodo] = useState(false)
  const [todoTitle, setTodoTitle] = useState('')
  const [payForm, setPayForm] = useState({
    amount: '',
    description: '',
    ledger: 'Agency',
    counterpartyName: '',
    category: '',
    dueDate: '',
  })
  const [payLinks, setPayLinks] = useState<PaymentLink[]>([])
  const [financeLedgerFilter, setFinanceLedgerFilter] = useState<'all' | 'Agency' | 'ClientAr' | 'ClientAp'>('all')
  const [crmLog, setCrmLog] = useState({
    summary: '',
    kind: 'Note',
    channel: '',
    followUpAt: '',
    nextAction: '',
  })
  const [crmMeta, setCrmMeta] = useState({
    relationshipStage: 'Ativo',
    nextAction: '',
    nextActionAt: '',
  })
  const [settleId, setSettleId] = useState<string | null>(null)
  const [newContractName, setNewContractName] = useState('')
  const [partnerPick, setPartnerPick] = useState('')
  const [employeePick, setEmployeePick] = useState('')
  const [portalReply, setPortalReply] = useState('')
  const [portalLinkUrl, setPortalLinkUrl] = useState('')
  const [showPasswordId, setShowPasswordId] = useState<string | null>(null)
  const [topicForm, setTopicForm] = useState({ title: '', content: '' })
  const [credForm, setCredForm] = useState({ appName: '', login: '', password: '' })
  const [appForm, setAppForm] = useState({ name: '' })
  const [invoiceForm, setInvoiceForm] = useState({
    reference: '',
    amount: '',
    periodStart: '',
    periodEnd: '',
    status: 'Open',
    kind: 'AgencyFee',
    counterpartyName: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    email: '',
    segment: '',
    clientGroupId: '',
    tags: '',
    preferredLanguage: 'pt-BR',
    marketCountry: '',
    needsQuickResponse: false,
    document: '',
    address: '',
    contractCode: '',
    contractRenewalDate: '',
    timeZoneId: 'America/Sao_Paulo',
    crm: '',
    financeNotes: '',
    contractNotes: '',
    serviceWorkNotes: '',
    additionalNotes: '',
  })
  const { data: timezones = [] } = useTimeZones()
  const { data: groups = [] } = useQuery({
    queryKey: ['client-groups'],
    queryFn: () => api.get<{ id: string; name: string; color: string }[]>('/client-groups'),
  })
  const [notesDraft, setNotesDraft] = useState({
    crm: '',
    financeNotes: '',
    contractNotes: '',
    serviceWorkNotes: '',
    additionalNotes: '',
  })

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get<ClientDetail>(`/clients/${id}`),
    enabled: !!id,
  })

  const { data: clientPartners = [] } = useQuery({
    queryKey: ['client-partners', id],
    queryFn: () => api.get<ClientPartnerLink[]>(`/clients/${id}/partners`),
    enabled: !!id && tab === 'parceiros',
  })

  const { data: orgPartners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => api.get<Partner[]>('/partners'),
    enabled: tab === 'parceiros' && canPartners,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/employees'),
    enabled: !!id && (tab === 'equipe' || canEmployees),
  })

  const { data: sharedUsers = [] } = useQuery({
    queryKey: ['shared-users'],
    queryFn: () => api.get<SharedUser[]>('/shared-users'),
    enabled: !!id && tab === 'equipe' && canSettings,
  })

  const assignEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      await api.post(`/employees/${employeeId}/clients/${id}`, {})
      if (!canSettings || !id) return
      const emp = employees.find((e) => e.id === employeeId)
      const email = emp?.email?.toLowerCase()
      if (!email) return
      const user = sharedUsers.find(
        (u) => !u.isOwner && u.email?.toLowerCase() === email,
      )
      if (!user || user.assignedClientIds.includes(id)) return
      await api.patch(`/shared-users/${user.id}`, {
        assignedClientIds: [...user.assignedClientIds, id],
      })
    },
    onSuccess: () => {
      setEmployeePick('')
      void qc.invalidateQueries({ queryKey: ['client', id] })
      void qc.invalidateQueries({ queryKey: ['employee-summary'] })
      void qc.invalidateQueries({ queryKey: ['shared-users'] })
    },
  })

  const unassignEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      await api.delete(`/employees/${employeeId}/clients/${id}`)
      // Mantém o login: tirar do atendimento ≠ bloquear a conta.
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['client', id] })
      void qc.invalidateQueries({ queryKey: ['employee-summary'] })
    },
  })

  const toggleSharedAccess = useMutation({
    mutationFn: ({ user, grant }: { user: SharedUser; grant: boolean }) => {
      const next = grant
        ? [...new Set([...user.assignedClientIds, id!])]
        : user.assignedClientIds.filter((cid) => cid !== id)
      return api.patch<SharedUser>(`/shared-users/${user.id}`, { assignedClientIds: next })
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['shared-users'] }),
  })

  useEffect(() => {
    if (!client || !id) return
    renameTab(`/clientes/${id}`, client.name)
  }, [client, id, renameTab])

  useEffect(() => {
    if (!client) return
    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      companyName: client.companyName || '',
      email: client.email || '',
      segment: client.segment || '',
      clientGroupId: client.clientGroupId || '',
      tags: (client.tags || []).join(', '),
      preferredLanguage: client.preferredLanguage || 'pt-BR',
      marketCountry: client.marketCountry || '',
      needsQuickResponse: !!client.needsQuickResponse,
      document: client.document || '',
      address: client.address || '',
      contractCode: client.contractCode || '',
      contractRenewalDate: client.contractRenewalDate?.slice(0, 10) || '',
      timeZoneId: client.timeZoneId || 'America/Sao_Paulo',
      crm: client.crm || '',
      financeNotes: client.financeNotes || '',
      contractNotes: client.contractNotes || '',
      serviceWorkNotes: client.serviceWorkNotes || '',
      additionalNotes: client.additionalNotes || '',
    })
    setNotesDraft({
      crm: client.crm || '',
      financeNotes: client.financeNotes || '',
      contractNotes: client.contractNotes || '',
      serviceWorkNotes: client.serviceWorkNotes || '',
      additionalNotes: client.additionalNotes || '',
    })
    setCrmMeta({
      relationshipStage: client.relationshipStage || 'Ativo',
      nextAction: client.nextAction || '',
      nextActionAt: client.nextActionAtUtc ? client.nextActionAtUtc.slice(0, 16) : '',
    })
  }, [client])

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['client', id] })

  const createClientContract = useMutation({
    mutationFn: () =>
      api.post('/contracts', {
        name: newContractName || `Contrato — ${client?.name}`,
        type: 'Client',
        clientId: id,
        status: 'Active',
      }),
    onSuccess: () => {
      setNewContractName('')
      invalidate()
    },
  })

  const assignPartner = useMutation({
    mutationFn: () =>
      api.post(`/clients/${id}/partners`, { partnerId: partnerPick, status: 'Active' }),
    onSuccess: () => {
      setPartnerPick('')
      void qc.invalidateQueries({ queryKey: ['client-partners', id] })
      void qc.invalidateQueries({ queryKey: ['partners'] })
    },
  })

  const removePartner = useMutation({
    mutationFn: (partnerId: string) => api.delete(`/partners/${partnerId}/clients/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['client-partners', id] })
      void qc.invalidateQueries({ queryKey: ['partners'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: () =>
      api.put(`/clients/${id}`, {
        ...editForm,
        clientGroupId: editForm.clientGroupId || null,
        clearGroup: !editForm.clientGroupId,
        tags: editForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        contractRenewalDate: editForm.contractRenewalDate || null,
      }),
    onSuccess: () => {
      invalidate()
      setShowEdit(false)
    },
  })

  const notesMutation = useMutation({
    mutationFn: () => api.patch(`/clients/${id}/notes`, notesDraft),
    onSuccess: invalidate,
  })

  const topicMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/topics`, topicForm),
    onSuccess: () => {
      invalidate()
      setShowTopic(false)
      setTopicForm({ title: '', content: '' })
    },
  })

  const deleteTopicMutation = useMutation({
    mutationFn: (topicId: string) => api.delete(`/clients/${id}/topics/${topicId}`),
    onSuccess: invalidate,
  })

  const credMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/credentials`, credForm),
    onSuccess: () => {
      invalidate()
      setShowCred(false)
      setCredForm({ appName: '', login: '', password: '' })
    },
  })

  const deleteCredMutation = useMutation({
    mutationFn: (credentialId: string) => api.delete(`/clients/${id}/credentials/${credentialId}`),
    onSuccess: invalidate,
  })

  const appMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/apps`, appForm),
    onSuccess: () => {
      invalidate()
      setShowApp(false)
      setAppForm({ name: '' })
    },
  })

  const deleteAppMutation = useMutation({
    mutationFn: (appId: string) => api.delete(`/clients/${id}/apps/${appId}`),
    onSuccess: invalidate,
  })

  const invoiceMutation = useMutation({
    mutationFn: () =>
      api.post(`/clients/${id}/invoices`, {
        reference: invoiceForm.reference,
        amount: parseFloat(invoiceForm.amount),
        periodStart: invoiceForm.periodStart,
        periodEnd: invoiceForm.periodEnd,
        status: invoiceForm.status,
        kind: invoiceForm.kind,
        counterpartyName: invoiceForm.counterpartyName || null,
      }),
    onSuccess: () => {
      invalidate()
      setShowInvoice(false)
      setInvoiceForm({
        reference: '',
        amount: '',
        periodStart: '',
        periodEnd: '',
        status: 'Open',
        kind: 'AgencyFee',
        counterpartyName: '',
      })
    },
  })

  const todoMutation = useMutation({
    mutationFn: () =>
      api.post('/todos', {
        title: todoTitle,
        clientId: id,
        scope: 'General',
      }),
    onSuccess: () => {
      invalidate()
      setShowTodo(false)
      setTodoTitle('')
    },
  })

  const completeTodoMutation = useMutation({
    mutationFn: (todoId: string) => api.patch(`/todos/${todoId}`, { status: 'Done' }),
    onSuccess: invalidate,
  })

  const paymentMutation = useMutation({
    mutationFn: () =>
      api.post('/payments', {
        amount: parseFloat(payForm.amount),
        description:
          payForm.description ||
          (payForm.ledger === 'Agency'
            ? `Recebimento Fatto · ${client?.name ?? 'cliente'}`
            : payForm.ledger === 'ClientAr'
              ? `Recebível do cliente · ${payForm.counterpartyName || 'terceiro'}`
              : `Pagável do cliente · ${payForm.counterpartyName || 'fornecedor'}`),
        clientId: id,
        ledger: payForm.ledger,
        counterpartyName: payForm.counterpartyName || null,
        category: payForm.category || null,
        dueAt: payForm.dueDate ? `${payForm.dueDate}T12:00:00.000Z` : null,
        links: linksToApi(payLinks),
      }),
    onSuccess: () => {
      invalidate()
      void qc.invalidateQueries({ queryKey: ['payments'] })
      setPayLinks([])
      setPayForm({
        amount: '',
        description: '',
        ledger: payForm.ledger,
        counterpartyName: '',
        category: '',
        dueDate: '',
      })
    },
  })

  const crmEntryMutation = useMutation({
    mutationFn: () =>
      api.post(`/clients/${id}/crm-entries`, {
        summary: crmLog.summary,
        kind: crmLog.kind,
        channel: crmLog.channel || null,
        followUpAtUtc: crmLog.followUpAt ? new Date(crmLog.followUpAt).toISOString() : null,
        nextAction: crmLog.nextAction || null,
      }),
    onSuccess: () => {
      invalidate()
      setCrmLog({ summary: '', kind: 'Note', channel: '', followUpAt: '', nextAction: '' })
    },
  })

  const crmMetaMutation = useMutation({
    mutationFn: () =>
      api.patch(`/clients/${id}/notes`, {
        relationshipStage: crmMeta.relationshipStage,
        nextAction: crmMeta.nextAction,
        nextActionAtUtc: crmMeta.nextActionAt
          ? new Date(crmMeta.nextActionAt).toISOString()
          : null,
        crm: notesDraft.crm,
        additionalNotes: notesDraft.additionalNotes,
      }),
    onSuccess: invalidate,
  })

  const { data: portalMessages = [] } = useQuery({
    queryKey: ['portal-messages', id],
    queryFn: () =>
      api.get<
        {
          id: string
          body: string
          fromContractor: boolean
          authorLabel: string
          createdAt: string
        }[]
      >(`/clients/${id}/portal-messages`),
    enabled: !!id && tab === 'portal',
    refetchInterval: tab === 'portal' ? 8_000 : false,
  })

  const { data: portalDocs = [] } = useQuery({
    queryKey: ['client-documents', id],
    queryFn: () =>
      api.get<
        {
          id: string
          title: string
          fileName: string
          kind: string
          uploadedBy: string
          uploaderLabel?: string
          createdAt: string
        }[]
      >(`/clients/${id}/documents`),
    enabled: !!id && tab === 'portal',
  })

  const portalReplyMutation = useMutation({
    mutationFn: () => api.post(`/clients/${id}/portal-messages`, { body: portalReply }),
    onSuccess: () => {
      setPortalReply('')
      void qc.invalidateQueries({ queryKey: ['portal-messages', id] })
    },
  })

  const createPortalLinkMutation = useMutation({
    mutationFn: () =>
      api.post<{ token: string }>('/share-links', { scope: 'portal', clientId: id }),
    onSuccess: (data) => {
      setPortalLinkUrl(`${window.location.origin}/s/${data.token}`)
      void qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })

  const renewalLabel = useMemo(() => {
    if (!client?.contractRenewalDate) return null
    const date = new Date(client.contractRenewalDate)
    const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return { date: date.toLocaleDateString('pt-BR'), days }
  }, [client?.contractRenewalDate])

  const teamRows = useMemo(
    () =>
      id
        ? buildClientTeamRows(client?.responsibles, sharedUsers, id, canSettings)
        : [],
    [client?.responsibles, sharedUsers, id, canSettings],
  )

  if (isLoading) return <LoadingSpinner />
  if (!client) return <EmptyState title="Cliente não encontrado" />

  const openTodos = (client.todos || client.openTodos || []).filter((t) => t.status !== 'Done').slice(0, 3)
  const nextMeetings = (client.agenda || []).slice(0, 2)
  const docs = (client.contracts || []).slice(0, 3)
  const relation = client.onboardingCompleted ? 80 : client.status === 'Active' ? 72 : 45
  const loginOnlyCandidates = canSettings
    ? sharedUsers.filter(
        (u) =>
          !u.isOwner &&
          !u.assignedClientIds.includes(id!) &&
          !client.responsibles?.some(
            (r) => r.email && r.email.toLowerCase() === u.email?.toLowerCase(),
          ),
      )
    : []

  return (
    <div>
      <div className="mona-mobile-only mona-m-stack">
        <Link to="/clientes" className="text-sm font-semibold text-ink-600">← Clientes</Link>
        <div className="mona-m-profile">
          <MobileAvatar name={client.name} />
          <div>
            <strong>{client.name}</strong>
            <p>{client.companyName || client.segment || 'Cliente MONA'}</p>
            <p className="mt-1"><StatusBadge status={client.status} /></p>
          </div>
        </div>
        {client.additionalNotes ? (
          <p className="text-sm italic text-ink-500">“{client.additionalNotes}”</p>
        ) : null}
        <div className="mona-m-actions">
          {client.phone ? (
            <a href={`tel:${client.phone}`}>
              <span><Phone size={16} /></span>
              Ligar
            </a>
          ) : (
            <span>
              <span><Phone size={16} /></span>
              Ligar
            </span>
          )}
          {client.email ? (
            <a href={`mailto:${client.email}`}>
              <span><Mail size={16} /></span>
              E-mail
            </a>
          ) : (
            <span>
              <span><Mail size={16} /></span>
              E-mail
            </span>
          )}
          {client.phone ? (
            <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <span><MessageCircle size={16} /></span>
              WhatsApp
            </a>
          ) : (
            <span>
              <span><MessageCircle size={16} /></span>
              WhatsApp
            </span>
          )}
          <button type="button" onClick={() => setShowEdit(true)}>
            <span><MoreHorizontal size={16} /></span>
            Mais
          </button>
        </div>
        <div className="mona-m-row">
          <div className="mona-m-row__body">
            <strong>Relacionamento</strong>
            <p>Cliente {client.status === 'Active' ? 'ativo' : 'em acompanhamento'}</p>
            <MobileProgress value={relation} />
          </div>
          <span className="mona-m-badge">{relation}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="mona-m-stat is-purple">
            <p><CheckSquare size={14} /> Tarefas em aberto</p>
            <strong>{openTodos.length}</strong>
            <span>pendentes</span>
          </div>
          <div className="mona-m-stat is-orange">
            <p><CalendarDays size={14} /> Próximas reuniões</p>
            <strong>{nextMeetings.length}</strong>
            <span>na agenda</span>
          </div>
        </div>
        <div className="mona-m-list">
          {openTodos.map((todo) => (
            <MobileRow key={todo.id} to="/todos" title={todo.title} meta="Tarefa" />
          ))}
          {nextMeetings.map((event) => (
            <MobileRow
              key={event.id}
              to="/agenda"
              title={event.title}
              meta={new Date(event.startAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            />
          ))}
          {docs.map((doc) => (
            <MobileRow
              key={doc.id}
              to="/contratos"
              icon={<span className="mona-m-icon"><FileText size={15} /></span>}
              title={doc.name}
              meta={doc.status}
            />
          ))}
        </div>
        <MobileTip>Anote o que o cliente prefere e volte no próximo contato com contexto.</MobileTip>
      </div>

      <div className="mona-desktop-only mb-4 hidden text-sm text-ink-500 md:block">
        <Link to="/" className="hover:text-brand-800">Dashboard</Link>
        <span className="mx-1.5">›</span>
        <Link to="/clientes" className="hover:text-brand-800">Clientes</Link>
        <span className="mx-1.5">›</span>
        <span className="text-ink-900">{client.name}</span>
      </div>

      <div className="mona-desktop-only">
      <PageHeader
        title={client.companyName ? `${client.name} – ${client.companyName}` : client.name}
        subtitle="Central do cliente: dados, acessos, financeiro e operações"
        actions={
          <div className="flex gap-2">
            <Link to="/clientes"><Button variant="secondary" size="sm">← Voltar</Button></Link>
            {canWrite && (
              <Button size="sm" variant="secondary" onClick={() => setShowEdit(true)}>
                <Pencil size={14} /> Editar
              </Button>
            )}
          </div>
        }
      />
      </div>

      <Card className="mb-5 mona-desktop-only">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-900">
            {initials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-ink-900 app-font">{client.name}</h2>
              <StatusBadge status={client.status} />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 text-sm">
              <div>
                <p className="text-ink-500">Empresa</p>
                <p className="font-medium text-ink-900">{client.companyName || '—'}</p>
              </div>
              <div>
                <p className="text-ink-500">Responsáveis</p>
                {client.responsibles?.length ? (
                  <button
                    type="button"
                    className="font-medium text-brand-800 hover:underline"
                    onClick={() => setTab('equipe')}
                  >
                    {client.responsibles.map((r) => r.name).join(', ')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="font-medium text-ink-500 hover:text-brand-800 hover:underline"
                    onClick={() => setTab('equipe')}
                  >
                    Nenhum — vincular equipe
                  </button>
                )}
              </div>
              <div>
                <p className="text-ink-500">Contato</p>
                <p className="font-medium text-ink-900">{client.phone || '—'}</p>
                <p className="text-ink-700">{client.email || '—'}</p>
              </div>
              <div>
                <p className="text-ink-500">Fuso / idioma / mercado</p>
                <p className="font-medium text-ink-900">{client.timeZoneId || 'America/Sao_Paulo'}</p>
                <p className="text-xs text-ink-600">
                  {client.preferredLanguage || 'pt-BR'}
                  {client.marketCountry ? ` · ${client.marketCountry}` : ''}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Grupo / tags</p>
                <p className="font-medium text-ink-900">{client.clientGroupName || 'Sem grupo'}</p>
                {!!client.tags?.length && (
                  <p className="text-xs text-ink-600">{client.tags.join(' · ')}</p>
                )}
                {client.needsQuickResponse && (
                  <p className="text-xs font-semibold text-red-600">Atendimento rápido</p>
                )}
              </div>
              <div>
                <p className="text-ink-500">Segmento / Contrato</p>
                <p className="font-medium text-ink-900">{client.segment || '—'}</p>
                <p className="text-ink-700">
                  {client.contractCode || '—'}
                  {renewalLabel ? ` · ${renewalLabel.date}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-ink-100 bg-white p-1 pr-16">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-brand-800 text-white' : 'text-ink-700 hover:bg-ink-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm text-ink-500">Desde</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">
                {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '—'}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-ink-500">Recebido</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{money(client.summary?.paidTotal)}</p>
            </Card>
            <Card>
              <p className="text-sm text-ink-500">Pendências</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{client.summary?.openTodos ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-ink-500">Invoices</p>
              <p className="mt-1 text-lg font-semibold text-ink-900">{client.summary?.invoices ?? 0}</p>
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink-900">Equipe neste cliente</h3>
                <p className="text-xs text-ink-500">Quem da minha equipe atende este cliente</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setTab('equipe')}>
                Ver e vincular
              </Button>
            </div>
            {client.responsibles?.length ? (
              <ul className="flex flex-wrap gap-2">
                {client.responsibles.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/prestadores/${r.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-ink-50 px-3 py-1.5 text-sm text-ink-900 hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: r.color || '#0F4C5C' }}
                      />
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">Ninguém da equipe vinculado ainda.</p>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-semibold text-ink-900">Informações adicionais</h3>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-ink-500">Documento</dt><dd className="text-ink-900">{client.document || '—'}</dd></div>
                <div><dt className="text-ink-500">Endereço</dt><dd className="text-ink-900">{client.address || '—'}</dd></div>
                <div><dt className="text-ink-500">Observações</dt><dd className="whitespace-pre-wrap text-ink-900">{client.additionalNotes || '—'}</dd></div>
              </dl>
            </Card>
            <Card>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink-900">Pendências abertas</h3>
                {canTodos && (
                  <Button size="sm" variant="secondary" onClick={() => setShowTodo(true)}>
                    <Plus size={14} /> Tarefa
                  </Button>
                )}
              </div>
              {client.openTodos?.length ? (
                <ul className="space-y-2">
                  {client.openTodos.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-ink-50 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-ink-900">{t.title}</span>
                      {canTodos ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => completeTodoMutation.mutate(t.id)}
                        >
                          Concluir
                        </Button>
                      ) : (
                        <span className="text-xs text-ink-500">{t.status}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-500">Nenhuma pendência aberta.</p>
              )}
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">Tópicos de observação</h3>
              {canWrite && (
                <Button size="sm" variant="secondary" onClick={() => setShowTopic(true)}>
                  <Plus size={14} /> Tópico
                </Button>
              )}
            </div>
            {client.topics?.length ? (
              <ul className="space-y-2">
                {client.topics.map((t) => (
                  <li key={t.id} className="rounded-xl border border-ink-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink-900">{t.title}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{t.content}</p>
                      </div>
                      {canWrite && (
                        <button type="button" className="text-ink-400 hover:text-red-600" onClick={() => deleteTopicMutation.mutate(t.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">Nenhum tópico adicionado.</p>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-ink-900">Operações neste cliente</h3>
            <div className="flex flex-wrap gap-2">
              {canTodos && (
                <Button variant="secondary" size="sm" onClick={() => setShowTodo(true)}>
                  <CheckSquare size={14} /> Nova tarefa
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setTab('financeiro')}>
                <Wallet size={14} /> Financeiro / baixa
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTab('contrato')}>
                <FileText size={14} /> Contrato
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTab('acessos')}>
                <KeyRound size={14} /> Acessos
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setTab('crm')}>
                <Pencil size={14} /> CRM
              </Button>
              <Link to={`/agenda?clientId=${id}`}>
                <Button variant="secondary" size="sm">
                  <CalendarDays size={14} /> Agenda
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      {tab === 'equipe' && (
        <div className="space-y-4">
          <Card>
            <div className="mb-4">
              <h3 className="font-semibold text-ink-900">Quem está neste cliente</h3>
              <p className="mt-1 text-sm text-ink-600">
                Quem <strong>atende</strong> precisa conseguir <strong>entrar na MONA</strong>. Ao
                vincular alguém, o login é liberado automaticamente se a pessoa já tiver conta.
              </p>
            </div>

            {teamRows.length === 0 ? (
              <EmptyState
                title="Ninguém neste cliente ainda"
                description="Vincule alguém da Minha equipe abaixo."
              />
            ) : (
              <ul className="space-y-2">
                {teamRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {row.color && (
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />
                        )}
                        {row.employeeId ? (
                          <Link
                            to={`/prestadores/${row.employeeId}`}
                            className="truncate font-medium text-ink-900 hover:underline"
                          >
                            {row.name}
                          </Link>
                        ) : (
                          <span className="truncate font-medium text-ink-900">{row.name}</span>
                        )}
                      </div>
                      {row.email && <p className="truncate text-xs text-ink-500">{row.email}</p>}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            row.atende ? 'bg-brand-50 text-brand-900' : 'bg-ink-50 text-ink-400'
                          }`}
                        >
                          {row.atende ? 'Atende' : 'Não atende'}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            row.podeEntrar ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
                          }`}
                        >
                          {row.user?.isOwner
                            ? 'Pode entrar · conta principal'
                            : row.podeEntrar
                              ? `Pode entrar${row.user?.accessTypeName ? ` · ${row.user.accessTypeName}` : ''}`
                              : row.atende
                                ? 'Falta login — não abre a MONA'
                                : 'Sem login neste cliente'}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {canEmployees && row.employeeId && row.atende && (
                        <button
                          type="button"
                          className="text-xs text-red-700 hover:underline"
                          disabled={unassignEmployee.isPending}
                          onClick={() => unassignEmployee.mutate(row.employeeId!)}
                        >
                          Tirar do atendimento
                        </button>
                      )}
                      {canSettings && row.user && !row.user.isOwner && row.podeEntrar && (
                        <button
                          type="button"
                          className="text-xs text-red-700 hover:underline"
                          disabled={toggleSharedAccess.isPending}
                          onClick={() => toggleSharedAccess.mutate({ user: row.user!, grant: false })}
                        >
                          Tirar o login
                        </button>
                      )}
                      {canSettings && row.user && !row.user.isOwner && !row.podeEntrar && row.atende && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={toggleSharedAccess.isPending}
                          onClick={() => toggleSharedAccess.mutate({ user: row.user!, grant: true })}
                        >
                          Liberar login
                        </Button>
                      )}
                      {canSettings && row.atende && !row.podeEntrar && !row.user && (
                        <Link to="/configuracoes" className="text-xs text-brand-800 hover:underline">
                          Criar login em Configurações
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {canEmployees && (
              <div className="mt-5 border-t border-ink-100 pt-4">
                <p className="mb-2 text-sm font-medium text-ink-900">Colocar alguém para atender</p>
                <p className="mb-2 text-xs text-ink-500">
                  Só quem tem login (Minha equipe). Ao vincular, o acesso na MONA também é liberado.
                </p>
                <div className="flex flex-wrap items-end gap-2">
                  <Select
                    label="Da Minha equipe"
                    value={employeePick}
                    onChange={(e) => setEmployeePick(e.target.value)}
                    className="min-w-[200px]"
                  >
                    <option value="">Selecione…</option>
                    {employees
                      .filter((e) => !client.responsibles?.some((r) => r.id === e.id))
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                  </Select>
                  <Button
                    size="sm"
                    disabled={!employeePick || assignEmployee.isPending}
                    onClick={() => assignEmployee.mutate(employeePick)}
                  >
                    Vincular atendimento
                  </Button>
                  <Link to="/prestadores" className="text-sm text-brand-800 hover:underline">
                    Abrir Minha equipe →
                  </Link>
                </div>
              </div>
            )}

            {loginOnlyCandidates.length > 0 && (
              <div className="mt-4 border-t border-ink-100 pt-4">
                <p className="mb-1 text-sm font-medium text-ink-900">
                  Liberar login (sem colocar no atendimento)
                </p>
                <p className="mb-2 text-xs text-ink-500">
                  Raro: a pessoa vê o cliente na MONA, mas não está marcada como quem atende.
                </p>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-ink-100 p-3">
                  {loginOnlyCandidates.map((u) => (
                    <div key={u.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-ink-800">
                        {u.name}
                        <span className="text-ink-500"> · {u.email}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={toggleSharedAccess.isPending}
                        onClick={() => toggleSharedAccess.mutate({ user: u, grant: true })}
                      >
                        Liberar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'apps' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">Aplicativos utilizados</h3>
            {canWrite && <Button size="sm" onClick={() => setShowApp(true)}><Plus size={14} /> Adicionar</Button>}
          </div>
          {client.apps?.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {client.apps.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AppWindow size={16} className="text-brand-800" />
                    <span className="font-medium text-ink-900">{a.name}</span>
                  </div>
                  {canWrite && (
                    <button type="button" className="text-ink-400 hover:text-red-600" onClick={() => deleteAppMutation.mutate(a.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nenhum aplicativo cadastrado" />
          )}
          <div className="mt-4">
            <Link to="/apps" className="text-sm font-medium text-brand-800 hover:underline">Ver catálogo de apps →</Link>
          </div>
        </Card>
      )}

      {tab === 'acessos' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">Logins e senhas</h3>
            {canWrite && <Button size="sm" onClick={() => setShowCred(true)}><Plus size={14} /> Adicionar</Button>}
          </div>
          {client.credentials?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-ink-500">
                    <th className="px-2 py-2 font-medium">App</th>
                    <th className="px-2 py-2 font-medium">Login</th>
                    <th className="px-2 py-2 font-medium">Senha</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {client.credentials.map((c) => (
                    <tr key={c.id} className="border-b border-ink-50">
                      <td className="px-2 py-3 font-medium text-ink-900">{c.appName}</td>
                      <td className="px-2 py-3 text-ink-700">{c.login}</td>
                      <td className="px-2 py-3 font-mono text-ink-700">
                        {showPasswordId === c.id ? c.password : '••••••••'}
                        <button
                          type="button"
                          className="ml-2 inline-flex text-ink-400 hover:text-brand-800"
                          onClick={() => setShowPasswordId((v) => (v === c.id ? null : c.id))}
                        >
                          {showPasswordId === c.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                      <td className="px-2 py-3 text-right">
                        {canWrite && (
                          <button type="button" className="text-ink-400 hover:text-red-600" onClick={() => deleteCredMutation.mutate(c.id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhum acesso cadastrado" />
          )}
          {client.links?.length ? (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-ink-900">Links úteis</h4>
              <ul className="space-y-1">
                {client.links.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-800 hover:underline">
                      <Link2 size={14} /> {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      )}

      {tab === 'crm' && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-ink-900">Relacionamento</h3>
                  <p className="text-xs text-ink-500">
                    Último contato:{' '}
                    {client.lastContactAtUtc
                      ? new Date(client.lastContactAtUtc).toLocaleString('pt-BR')
                      : '—'}
                  </p>
                </div>
                {canWrite && (
                  <Button size="sm" disabled={crmMetaMutation.isPending} onClick={() => crmMetaMutation.mutate()}>
                    Salvar estágio
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Estágio"
                  value={crmMeta.relationshipStage}
                  onChange={(e) => setCrmMeta({ ...crmMeta, relationshipStage: e.target.value })}
                  disabled={!canWrite}
                >
                  <option value="Novo">Novo</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Vip">Vip</option>
                  <option value="EmRisco">Em risco</option>
                  <option value="Pausado">Pausado</option>
                </Select>
                <Input
                  label="Próxima ação"
                  value={crmMeta.nextAction}
                  onChange={(e) => setCrmMeta({ ...crmMeta, nextAction: e.target.value })}
                  disabled={!canWrite}
                  placeholder="Ex.: cobrar retorno, enviar proposta…"
                />
                <Input
                  label="Quando"
                  type="datetime-local"
                  value={crmMeta.nextActionAt}
                  onChange={(e) => setCrmMeta({ ...crmMeta, nextActionAt: e.target.value })}
                  disabled={!canWrite}
                />
              </div>
              {(client.nextAction || crmMeta.nextAction) && (
                <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-950">
                  <strong>Foco:</strong> {crmMeta.nextAction || client.nextAction}
                  {(crmMeta.nextActionAt || client.nextActionAtUtc) && (
                    <span className="text-brand-800">
                      {' '}
                      ·{' '}
                      {new Date(crmMeta.nextActionAt || client.nextActionAtUtc!).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </Card>

            {canWrite && (
              <Card>
                <h3 className="font-semibold text-ink-900">Registrar contato</h3>
                <p className="mb-3 text-xs text-ink-500">Rápido — entra na timeline do cliente.</p>
                <div className="space-y-2">
                  <Select
                    label="Tipo"
                    value={crmLog.kind}
                    onChange={(e) => setCrmLog({ ...crmLog, kind: e.target.value })}
                  >
                    <option value="Note">Anotação</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">E-mail</option>
                    <option value="Call">Ligação</option>
                    <option value="Meeting">Reunião</option>
                    <option value="Other">Outro</option>
                  </Select>
                  <Input
                    label="Canal (opcional)"
                    value={crmLog.channel}
                    onChange={(e) => setCrmLog({ ...crmLog, channel: e.target.value })}
                    placeholder="WhatsApp pessoal, e-mail, etc."
                  />
                  <Textarea
                    label="O que aconteceu?"
                    value={crmLog.summary}
                    onChange={(e) => setCrmLog({ ...crmLog, summary: e.target.value })}
                    className="min-h-[88px]"
                  />
                  <Input
                    label="Follow-up em"
                    type="datetime-local"
                    value={crmLog.followUpAt}
                    onChange={(e) => setCrmLog({ ...crmLog, followUpAt: e.target.value })}
                  />
                  <Input
                    label="Próxima ação (opcional)"
                    value={crmLog.nextAction}
                    onChange={(e) => setCrmLog({ ...crmLog, nextAction: e.target.value })}
                  />
                  <Button
                    className="w-full"
                    disabled={!crmLog.summary.trim() || crmEntryMutation.isPending}
                    onClick={() => crmEntryMutation.mutate()}
                  >
                    Registrar
                  </Button>
                </div>
              </Card>
            )}
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-ink-900">Linha do tempo</h3>
            {(client.crmEntries?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-500">
                Nenhum contato registrado ainda. Use “Registrar contato” para começar o histórico.
              </p>
            ) : (
              <ul className="space-y-2">
                {client.crmEntries!.map((e) => (
                  <li key={e.id} className="rounded-xl border border-ink-100 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span className="rounded-full bg-ink-50 px-2 py-0.5 font-semibold text-ink-700">
                        {e.kind}
                      </span>
                      <span>{new Date(e.createdAt).toLocaleString('pt-BR')}</span>
                      {e.createdByName && <span>· {e.createdByName}</span>}
                      {e.channel && <span>· {e.channel}</span>}
                    </div>
                    <p className="mt-1 text-sm text-ink-900">{e.summary}</p>
                    {e.followUpAtUtc && (
                      <p className="mt-1 text-xs text-brand-800">
                        Follow-up: {new Date(e.followUpAtUtc).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">Bloco de contexto</h3>
              {canWrite && (
                <Button size="sm" variant="secondary" onClick={() => crmMetaMutation.mutate()}>
                  Salvar notas
                </Button>
              )}
            </div>
            <Textarea
              label="Resumo do relacionamento (sempre à mão)"
              value={notesDraft.crm}
              onChange={(e) => setNotesDraft({ ...notesDraft, crm: e.target.value })}
              disabled={!canWrite}
              className="min-h-[120px]"
              placeholder="Preferências, tom, o que não esquecer…"
            />
            <Textarea
              className="mt-3 min-h-[90px]"
              label="Informações adicionais"
              value={notesDraft.additionalNotes}
              onChange={(e) => setNotesDraft({ ...notesDraft, additionalNotes: e.target.value })}
              disabled={!canWrite}
            />
          </Card>
        </div>
      )}

      {tab === 'portal' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink-900">Portal do contratante</h3>
                <p className="text-xs text-ink-500">
                  Link simples para o cliente acompanhar, falar com vocês e enviar fotos/comprovantes.
                </p>
              </div>
              {canWrite && (
                <Button size="sm" onClick={() => createPortalLinkMutation.mutate()}>
                  Gerar link
                </Button>
              )}
            </div>
            {portalLinkUrl && (
              <a
                href={portalLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 block break-all rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-900 hover:underline"
              >
                {portalLinkUrl}
              </a>
            )}
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-semibold text-ink-900">Mensagens</h3>
              <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
                {portalMessages.length === 0 && (
                  <p className="text-sm text-ink-500">Nenhuma mensagem do portal ainda.</p>
                )}
                {portalMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      m.fromContractor ? 'bg-amber-50 text-amber-950' : 'bg-brand-50 text-brand-950'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase opacity-70">
                      {m.fromContractor ? 'Contratante' : 'Equipe'} · {m.authorLabel}
                    </p>
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-60">
                      {new Date(m.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
              {canWrite && (
                <div className="space-y-2">
                  <Textarea
                    value={portalReply}
                    onChange={(e) => setPortalReply(e.target.value)}
                    placeholder="Responder ao contratante…"
                    className="min-h-[70px]"
                  />
                  <Button
                    size="sm"
                    disabled={!portalReply.trim() || portalReplyMutation.isPending}
                    onClick={() => portalReplyMutation.mutate()}
                  >
                    Enviar resposta
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-3 font-semibold text-ink-900">Documentos enviados</h3>
              {portalDocs.length === 0 ? (
                <p className="text-sm text-ink-500">Nenhum arquivo ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {portalDocs.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{d.title}</p>
                        <p className="text-xs text-ink-500">
                          {d.kind} · {d.uploaderLabel || d.uploadedBy} ·{' '}
                          {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-brand-800 underline"
                        onClick={async () => {
                          const token = localStorage.getItem('fatto_access_token')
                          const res = await fetch(`/api/v1/clients/${id}/documents/${d.id}/file`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          })
                          if (!res.ok) return
                          const blob = await res.blob()
                          window.open(URL.createObjectURL(blob), '_blank')
                        }}
                      >
                        Abrir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'financeiro' && (
        <div className="space-y-4">
          <p className="text-sm text-ink-600">
            Três livros no mesmo cliente: o que a <strong>Fatto recebe</strong>, o que o{' '}
            <strong>cliente recebe dos clientes dele</strong>, e o que ele <strong>paga a terceiros</strong>.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Fatto ← cliente</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                {money(client.summary?.agencyPaid ?? client.summary?.paidTotal)}
              </p>
              <p className="text-xs text-orange-700">
                A receber {money(client.summary?.agencyPending ?? client.summary?.pendingTotal)}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Cliente ← terceiros</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                {money(client.summary?.clientArPaid)}
              </p>
              <p className="text-xs text-orange-700">
                A receber {money(client.summary?.clientArPending)}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Cliente → fornecedores</p>
              <p className="mt-1 text-lg font-semibold text-ink-800">
                {money(client.summary?.clientApPaid)}
              </p>
              <p className="text-xs text-orange-700">
                A pagar {money(client.summary?.clientApPending)}
              </p>
            </Card>
          </div>

          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-ink-900">Movimentos</h3>
                <p className="text-xs text-ink-500">Baixa com comprovante ou senha Ju/admin</p>
              </div>
              <Select
                value={financeLedgerFilter}
                onChange={(e) =>
                  setFinanceLedgerFilter(e.target.value as typeof financeLedgerFilter)
                }
                className="min-w-[180px] text-xs"
              >
                <option value="all">Todos os livros</option>
                <option value="Agency">Só Fatto ← cliente</option>
                <option value="ClientAr">Só cliente ← terceiros</option>
                <option value="ClientAp">Só cliente → fornecedores</option>
              </Select>
            </div>

            {(() => {
              const list = (client.payments || []).filter(
                (p) => financeLedgerFilter === 'all' || (p.ledger || 'Agency') === financeLedgerFilter,
              )
              if (!list.length) {
                return <p className="text-sm text-ink-500">Nenhum movimento neste filtro.</p>
              }
              const ledgerLabel = (l?: string) =>
                l === 'ClientAr' ? 'Cliente←terceiro' : l === 'ClientAp' ? 'Cliente→fornecedor' : 'Fatto←cliente'
              return (
                <ul className="space-y-2">
                  {list.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink-100 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900">{p.description || 'Movimento'}</p>
                        <p className="text-xs text-ink-500">
                          {ledgerLabel(p.ledger)}
                          {p.counterpartyName ? ` · ${p.counterpartyName}` : ''}
                          {p.category ? ` · ${p.category}` : ''}
                          {p.dueDate
                            ? ` · venc. ${new Date(p.dueDate).toLocaleDateString('pt-BR')}`
                            : ''}
                          {p.paidAt
                            ? ` · pago ${new Date(p.paidAt).toLocaleDateString('pt-BR')}`
                            : ''}
                          {p.hasProof && p.proofFileName ? ` · ${p.proofFileName}` : ''}
                        </p>
                        <PaymentLinksChips links={p.links} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-semibold text-ink-900">{money(p.amount)}</p>
                          <p
                            className={`text-xs ${
                              p.status === 'Paid' ? 'text-emerald-700' : 'text-orange-700'
                            }`}
                          >
                            {p.status === 'Paid' ? 'Baixado' : 'Pendente'}
                          </p>
                        </div>
                        {p.status === 'Pending' && canFinance && (
                          <Button size="sm" onClick={() => setSettleId(p.id)}>
                            Dar baixa
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            })()}

            {canFinance && (
              <div className="mt-4 space-y-2 rounded-xl border border-dashed border-ink-200 p-3">
                <p className="text-xs font-semibold uppercase text-ink-500">Registrar movimento</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Select
                    label="Livro"
                    value={payForm.ledger}
                    onChange={(e) => setPayForm({ ...payForm, ledger: e.target.value })}
                  >
                    <option value="Agency">Fatto recebe do cliente</option>
                    <option value="ClientAr">Cliente recebe de terceiro</option>
                    <option value="ClientAp">Cliente paga fornecedor</option>
                  </Select>
                  <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  />
                  <Input
                    label="Vencimento"
                    type="date"
                    value={payForm.dueDate}
                    onChange={(e) => setPayForm({ ...payForm, dueDate: e.target.value })}
                  />
                  {payForm.ledger !== 'Agency' && (
                    <Input
                      label={payForm.ledger === 'ClientAr' ? 'Quem paga (terceiro)' : 'Fornecedor / terceiro'}
                      value={payForm.counterpartyName}
                      onChange={(e) => setPayForm({ ...payForm, counterpartyName: e.target.value })}
                      placeholder="Nome do pagante ou fornecedor"
                    />
                  )}
                  <Input
                    label="Categoria"
                    value={payForm.category}
                    onChange={(e) => setPayForm({ ...payForm, category: e.target.value })}
                    placeholder="Mensalidade, NF, taxa…"
                  />
                  <Input
                    label="Descrição"
                    value={payForm.description}
                    onChange={(e) => setPayForm({ ...payForm, description: e.target.value })}
                  />
                </div>
                <EntityLinksField
                  value={payLinks}
                  onChange={setPayLinks}
                  clientId={id}
                  compact
                />
                <Button
                  size="sm"
                  disabled={!payForm.amount || paymentMutation.isPending}
                  onClick={() => paymentMutation.mutate()}
                >
                  <CreditCard size={14} /> Registrar
                </Button>
              </div>
            )}

            {canWrite && (
              <div className="mt-4">
                <Textarea
                  label="Notas financeiras"
                  value={notesDraft.financeNotes}
                  onChange={(e) => setNotesDraft({ ...notesDraft, financeNotes: e.target.value })}
                />
                <Button className="mt-3" size="sm" onClick={() => notesMutation.mutate()}>
                  Salvar notas
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'contrato' && (
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-ink-500">Código</p>
                <p className="font-medium text-ink-900">{client.contractCode || '—'}</p>
              </div>
              <div>
                <p className="text-ink-500">Renovação</p>
                <p className="font-medium text-ink-900">
                  {renewalLabel ? `${renewalLabel.date} (${renewalLabel.days} dias)` : '—'}
                </p>
              </div>
              <div>
                <p className="text-ink-500">Contratos vinculados</p>
                <p className="font-medium text-ink-900">{client.summary?.contracts ?? 0}</p>
              </div>
            </div>
            {canWrite && (
              <div className="mt-4">
                <Textarea
                  label="Observações do contrato"
                  value={notesDraft.contractNotes}
                  onChange={(e) => setNotesDraft({ ...notesDraft, contractNotes: e.target.value })}
                />
                <Button className="mt-3" size="sm" onClick={() => notesMutation.mutate()}>Salvar</Button>
              </div>
            )}
          </Card>
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-ink-900">Arquivos / contratos deste cliente</h3>
              <div className="flex gap-3 text-sm">
                <Link to="/contratos" className="text-brand-800 hover:underline">Ver todos →</Link>
                <Link to={`/financeiro?clientId=${id}`} className="text-brand-800 hover:underline">
                  Financeiro →
                </Link>
              </div>
            </div>
            {client.contracts?.length ? (
              <ul className="space-y-2">
                {client.contracts.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-ink-900">{c.name}</p>
                      <p className="text-ink-500">{c.status}</p>
                    </div>
                    {c.pdfUrl ? (
                      <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="text-brand-800 hover:underline">PDF</a>
                    ) : (
                      <span className="text-ink-400">Sem PDF</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">Nenhum contrato vinculado.</p>
            )}
            {canContracts && (
              <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-ink-50 pt-4">
                <Input
                  label="Novo contrato"
                  placeholder={`Contrato — ${client.name}`}
                  value={newContractName}
                  onChange={(e) => setNewContractName(e.target.value)}
                  className="min-w-[220px]"
                />
                <Button
                  size="sm"
                  disabled={createClientContract.isPending}
                  onClick={() => createClientContract.mutate()}
                >
                  <Plus size={14} /> Criar
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'parceiros' && (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-ink-900">Parceiros deste cliente</h3>
              <p className="text-xs text-ink-500">
                Vínculos a partir do catálogo da organização (Fatto / admin).
              </p>
            </div>
            <Link to="/parceiras" className="text-sm text-brand-800 hover:underline">
              Catálogo →
            </Link>
          </div>
          {clientPartners.length ? (
            <ul className="space-y-2">
              {clientPartners.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-ink-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink-900">{p.name}</p>
                    <p className="text-ink-500">{p.service || p.contact || p.status}</p>
                  </div>
                  {canPartners && (
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
                      onClick={() => removePartner.mutate(p.partnerId)}
                    >
                      Remover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Nenhum parceiro vinculado a este cliente.</p>
          )}
          {canPartners && (
            <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-ink-50 pt-4">
              <Select
                label="Adicionar do catálogo"
                value={partnerPick}
                onChange={(e) => setPartnerPick(e.target.value)}
                className="min-w-[220px]"
              >
                <option value="">Selecione…</option>
                {orgPartners
                  .filter((p) => !clientPartners.some((c) => c.partnerId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </Select>
              <Button
                size="sm"
                disabled={!partnerPick || assignPartner.isPending}
                onClick={() => assignPartner.mutate()}
              >
                Vincular
              </Button>
            </div>
          )}
        </Card>
      )}

      {tab === 'invoices' && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-ink-900">Notas / invoices</h3>
              <p className="text-xs text-ink-500">
                Honorário Fatto ou NF gerada para o cliente do seu cliente.
              </p>
            </div>
            {canWrite && (
              <Button size="sm" onClick={() => setShowInvoice(true)}>
                <Plus size={14} /> Novo invoice
              </Button>
            )}
          </div>
          {client.invoices?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-ink-500">
                    <th className="px-2 py-2">Referência</th>
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Terceiro</th>
                    <th className="px-2 py-2">Período</th>
                    <th className="px-2 py-2">Valor</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-ink-50">
                      <td className="px-2 py-3 font-medium text-ink-900">{inv.reference}</td>
                      <td className="px-2 py-3 text-ink-700">
                        {inv.kind === 'ClientCustomer' ? 'NF cliente→cliente' : 'Honorário Fatto'}
                      </td>
                      <td className="px-2 py-3 text-ink-700">{inv.counterpartyName || '—'}</td>
                      <td className="px-2 py-3 text-ink-700">
                        {new Date(inv.periodStart).toLocaleDateString('pt-BR')} –{' '}
                        {new Date(inv.periodEnd).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-2 py-3 text-ink-900">{money(inv.amount)}</td>
                      <td className="px-2 py-3">
                        <span className="fv-pill bg-ink-50 text-ink-700">{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Nenhum invoice cadastrado" />
          )}
        </Card>
      )}

      {tab === 'servicos' && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">Trabalhos incluídos no serviço</h3>
            <Link to="/servicos" className="text-sm text-brand-800 hover:underline">Base de serviços →</Link>
          </div>
          <Textarea
            label="Escopo / trabalhos incluídos"
            value={notesDraft.serviceWorkNotes}
            onChange={(e) => setNotesDraft({ ...notesDraft, serviceWorkNotes: e.target.value })}
            disabled={!canWrite}
            className="min-h-[180px]"
          />
          {canWrite && (
            <Button className="mt-3" size="sm" onClick={() => notesMutation.mutate()}>Salvar escopo</Button>
          )}
          {client.onboarding?.length ? (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-ink-900">Onboarding</h4>
              <ul className="space-y-1">
                {client.onboarding.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm text-ink-700">
                    <span className={`h-2 w-2 rounded-full ${item.isCompleted ? 'bg-emerald-500' : 'bg-ink-300'}`} />
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      )}

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar cliente" size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Empresa" value={editForm.companyName} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} />
          <Input label="Telefone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="E-mail" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Select
            label="Grupo"
            value={editForm.clientGroupId}
            onChange={(e) => setEditForm({ ...editForm, clientGroupId: e.target.value })}
          >
            <option value="">— Sem grupo —</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input
            label="Tags (separadas por vírgula)"
            value={editForm.tags}
            onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            placeholder="urgente, docs, en…"
          />
          <Input
            label="Idioma preferido"
            value={editForm.preferredLanguage}
            onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value })}
            placeholder="pt-BR, es, en"
          />
          <Input
            label="Mercado (país)"
            value={editForm.marketCountry}
            onChange={(e) => setEditForm({ ...editForm, marketCountry: e.target.value })}
            placeholder="US, BR…"
          />
          <label className="flex items-center gap-2 self-end text-sm text-ink-700">
            <input
              type="checkbox"
              checked={editForm.needsQuickResponse}
              onChange={(e) => setEditForm({ ...editForm, needsQuickResponse: e.target.checked })}
            />
            Precisa atendimento rápido
          </label>
          <Input label="Documento / CNPJ" value={editForm.document} onChange={(e) => setEditForm({ ...editForm, document: e.target.value })} />
          <Input label="Código contrato" value={editForm.contractCode} onChange={(e) => setEditForm({ ...editForm, contractCode: e.target.value })} />
          <Input label="Renovação" type="date" value={editForm.contractRenewalDate} onChange={(e) => setEditForm({ ...editForm, contractRenewalDate: e.target.value })} />
          <Select
            label="Fuso horário (IANA)"
            value={editForm.timeZoneId}
            onChange={(e) => setEditForm({ ...editForm, timeZoneId: e.target.value })}
          >
            {(timezones.length
              ? timezones
              : [
                  { id: 'America/Sao_Paulo', label: 'America/Sao_Paulo' },
                  { id: 'America/New_York', label: 'America/New_York' },
                  { id: 'America/Los_Angeles', label: 'America/Los_Angeles' },
                  { id: 'Europe/London', label: 'Europe/London' },
                ]
            ).map((z) => (
              <option key={z.id} value={z.id}>{z.label}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <Input label="Endereço" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
          <Button disabled={!editForm.name || editMutation.isPending} onClick={() => editMutation.mutate()}>Salvar</Button>
        </div>
      </Modal>

      <Modal open={showTopic} onClose={() => setShowTopic(false)} title="Novo tópico">
        <div className="space-y-4">
          <Input label="Título" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} />
          <Textarea label="Observação" value={topicForm.content} onChange={(e) => setTopicForm({ ...topicForm, content: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTopic(false)}>Cancelar</Button>
            <Button disabled={!topicForm.title} onClick={() => topicMutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showCred} onClose={() => setShowCred(false)} title="Novo acesso">
        <div className="space-y-4">
          <Input label="Aplicativo" value={credForm.appName} onChange={(e) => setCredForm({ ...credForm, appName: e.target.value })} />
          <Input label="Login" value={credForm.login} onChange={(e) => setCredForm({ ...credForm, login: e.target.value })} />
          <Input label="Senha" type="password" value={credForm.password} onChange={(e) => setCredForm({ ...credForm, password: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCred(false)}>Cancelar</Button>
            <Button disabled={!credForm.appName || !credForm.login || !credForm.password} onClick={() => credMutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showApp} onClose={() => setShowApp(false)} title="Novo aplicativo">
        <div className="space-y-4">
          <Input label="Nome do app" value={appForm.name} onChange={(e) => setAppForm({ name: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowApp(false)}>Cancelar</Button>
            <Button disabled={!appForm.name} onClick={() => appMutation.mutate()}>Salvar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showInvoice} onClose={() => setShowInvoice(false)} title="Novo invoice">
        <div className="space-y-4">
          <Select
            label="Tipo"
            value={invoiceForm.kind}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, kind: e.target.value })}
          >
            <option value="AgencyFee">Honorário / NF da Fatto</option>
            <option value="ClientCustomer">NF gerida (cliente do cliente)</option>
          </Select>
          <Input
            label="Referência"
            value={invoiceForm.reference}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, reference: e.target.value })}
          />
          {invoiceForm.kind === 'ClientCustomer' && (
            <Input
              label="Cliente final / terceiro"
              value={invoiceForm.counterpartyName}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, counterpartyName: e.target.value })}
            />
          )}
          <Input
            label="Valor"
            type="number"
            value={invoiceForm.amount}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
          />
          <Input
            label="Início vigência"
            type="date"
            value={invoiceForm.periodStart}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, periodStart: e.target.value })}
          />
          <Input
            label="Fim vigência"
            type="date"
            value={invoiceForm.periodEnd}
            onChange={(e) => setInvoiceForm({ ...invoiceForm, periodEnd: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowInvoice(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !invoiceForm.reference ||
                !invoiceForm.amount ||
                !invoiceForm.periodStart ||
                !invoiceForm.periodEnd
              }
              onClick={() => invoiceMutation.mutate()}
            >
              <CreditCard size={14} /> Salvar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showTodo} onClose={() => setShowTodo(false)} title={`Tarefa · ${client.name}`}>
        <div className="space-y-4">
          <Input
            label="O que precisa ser feito?"
            value={todoTitle}
            onChange={(e) => setTodoTitle(e.target.value)}
            placeholder="Ex.: Enviar contrato assinado"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTodo(false)}>
              Cancelar
            </Button>
            <Button disabled={!todoTitle.trim() || todoMutation.isPending} onClick={() => todoMutation.mutate()}>
              Criar na ficha
            </Button>
          </div>
        </div>
      </Modal>

      <SettlePaymentModal
        open={!!settleId}
        paymentId={settleId}
        label={
          client.payments?.find((p) => p.id === settleId)
            ? `${client.payments.find((p) => p.id === settleId)?.description || 'Pagamento'} · ${money(client.payments.find((p) => p.id === settleId)?.amount)}`
            : undefined
        }
        onClose={() => setSettleId(null)}
        onSettled={() => {
          invalidate()
          void qc.invalidateQueries({ queryKey: ['payments'] })
        }}
      />
    </div>
  )
}
