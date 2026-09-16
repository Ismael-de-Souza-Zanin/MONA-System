import type { Permission } from '../permissions/constants'

export type ClientStatus = 'Active' | 'Inactive' | 'Notice' | 'Hold'

export interface AuthUser {
  id: string
  name: string
  email: string
  organizationId: string
  isOwner: boolean
  permissions: Permission[]
  assignedClientIds: string[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export interface Organization {
  id: string
  name: string
  document?: string
  phone?: string
  email?: string
  address?: string
  whatsAppSupportUrl?: string
}

export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
}

export interface AccessType {
  id: string
  name: string
  permissions: Permission[]
  isOwnerType?: boolean
  description?: string
}

export interface SharedUser {
  id: string
  name: string
  email: string
  accessTypeId: string
  accessTypeName?: string
  assignedClientIds: string[]
  isOwner?: boolean
  isCurrentUser?: boolean
}

export interface Client {
  id: string
  name: string
  phone?: string
  companyName?: string
  status: ClientStatus
  email?: string
  appsUsed?: string
  crm?: string
  segment?: string
  document?: string
  address?: string
  financeNotes?: string
  contractNotes?: string
  invoicesNotes?: string
  serviceWorkNotes?: string
  additionalNotes?: string
  loginsNotes?: string
  contractCode?: string
  contractRenewalDate?: string
  timeZoneId?: string
  clientGroupId?: string
  clientGroupName?: string
  clientGroupColor?: string
  tags?: string[]
  preferredLanguage?: string
  marketCountry?: string
  needsQuickResponse?: boolean
  onboardingCompleted?: boolean
  createdAt?: string
}

export interface ClientGroup {
  id: string
  name: string
  description?: string
  color: string
  sortOrder?: number
  clientCount?: number
}

export interface ClientTopic {
  id: string
  clientId: string
  title: string
  content: string
}

export interface ClientLink {
  id: string
  clientId: string
  label: string
  url: string
}

export interface ClientCredential {
  id: string
  appName: string
  login: string
  password: string
}

export interface ClientAppItem {
  id: string
  name: string
  appId?: string
}

export interface ClientInvoice {
  id: string
  reference: string
  amount: number
  periodStart: string
  periodEnd: string
  status: string
  kind?: string
  counterpartyName?: string
  dueDate?: string
  notes?: string
}

export interface ClientCrmEntry {
  id: string
  kind: string
  summary: string
  channel?: string
  followUpAtUtc?: string
  createdByName?: string
  createdAt: string
}

export interface ClientDetail extends Client {
  topics: ClientTopic[]
  links: ClientLink[]
  credentials?: ClientCredential[]
  apps?: ClientAppItem[]
  invoices?: ClientInvoice[]
  payments?: Payment[]
  crmEntries?: ClientCrmEntry[]
  relationshipStage?: string
  nextAction?: string
  nextActionAtUtc?: string
  lastContactAtUtc?: string
  contracts?: Contract[]
  todos?: TodoItem[]
  openTodos?: { id: string; title: string; status: string }[]
  agenda?: { id: string; title: string; startAt: string; endAt?: string }[]
  responsibles?: { id: string; name: string; color?: string; email?: string }[]
  onboarding?: OnboardingItem[]
  summary?: {
    since?: string
    paidTotal?: number
    pendingTotal?: number
    agencyPaid?: number
    agencyPending?: number
    clientArPaid?: number
    clientArPending?: number
    clientApPaid?: number
    clientApPending?: number
    openTodos?: number
    invoices?: number
    apps?: number
    credentials?: number
    contracts?: number
  }
}

export interface ClientStatusCounts {
  total: number
  active: number
  inactive: number
  notice: number
  hold: number
}

export interface ClientStatusChangeRequest {
  status: ClientStatus
  emailSent?: boolean
  paymentSettled?: boolean
  finalMessageSent?: boolean
  pendingResolved?: boolean
  removedFromGroup?: boolean
}

export interface Employee {
  id: string
  name: string
  phone?: string
  email?: string
  color?: string
  status?: string
  managerId?: string | null
}

export interface EmployeeSummary extends Employee {
  contractNotes?: string
  contracts?: Contract[]
  payments?: Payment[]
  assignedClients?: Client[]
  todos?: TodoItem[]
  workDays?: WorkDay[]
}

export interface WorkDay {
  date: string
  type: 'work' | 'off'
}

export interface PyramidNode {
  id: string
  name: string
  color?: string
  children: PyramidNode[]
}

export type PaymentLedger = 'Agency' | 'ClientAr' | 'ClientAp' | 'AssistantPayout'

export type PaymentLinkKind = 'todo' | 'agenda' | 'sop' | 'sop-run' | 'service' | 'contract'

export interface PaymentLink {
  id?: string
  kind: PaymentLinkKind | string
  entityId: string
  label: string
  path?: string
}

export interface Payment {
  id: string
  amount: number
  description?: string
  paidAt?: string | null
  dueDate?: string | null
  ledger?: PaymentLedger | string
  counterpartyName?: string
  category?: string
  clientId?: string
  clientName?: string
  employeeId?: string
  employeeName?: string
  status: 'Pending' | 'Paid'
  settleMethod?: string
  proofFileName?: string
  hasProof?: boolean
  /** Vínculos a tarefas, agenda, SOPs, serviços… (0..N de cada tipo). */
  links?: PaymentLink[]
}

export interface ActiveClientPaymentTask {
  clientId: string
  clientName: string
  hasPaymentThisMonth: boolean
}

export interface Partner {
  id: string
  name: string
  responsibleName?: string
  contact?: string
  service?: string
  notes?: string
  clients?: {
    clientId: string
    clientName?: string
    status: string
    notes?: string
  }[]
}

export interface ClientPartnerLink {
  id: string
  partnerId: string
  name: string
  responsibleName?: string
  contact?: string
  service?: string
  status: string
  notes?: string
}

export interface ServiceItem {
  id: string
  title: string
  description?: string
  category?: string
  specificities?: string[]
  assistantNotes?: string
  clientFacingNotes?: string
  isActive?: boolean
  clients?: {
    clientId: string
    clientName?: string
    status: string
    customNotes?: string
  }[]
}

export interface Contract {
  id: string
  name: string
  type: 'Client' | 'Provider'
  status: string
  pdfUrl?: string
  clientId?: string
  employeeId?: string
  partyName?: string
  partyPath?: string
}

export interface OnboardingClient {
  id: string
  clientId: string
  clientName: string
  completedCount: number
  totalCount: number
  items: OnboardingItem[]
}

export interface OnboardingItem {
  id: string
  title: string
  isCompleted: boolean
  sortOrder: number
}

export interface ChecklistTemplate {
  id: string
  name: string
  items: string[]
}

export interface AgendaCategory {
  id: string
  name: string
  color: string
}

export interface AgendaEvent {
  id: string
  title: string
  startAt: string
  endAt?: string
  startAtUtc?: string
  endAtUtc?: string
  startAtEventLocal?: string
  timeZoneId?: string
  displayTimeZoneId?: string
  clientTimeZoneId?: string
  remindMinutesBefore?: number
  categoryId?: string
  categoryName?: string
  categoryColor?: string
  responsibleUserId?: string
  responsibleUserName?: string
  clientId?: string
  clientName?: string
  description?: string
  kind?: 'Event' | 'Meeting' | 'Block' | string
  decisionCount?: number
  linkedTodos?: { id: string; title: string; status: string; dueAtUtc?: string }[]
}

export interface SopScript {
  id: string
  type: string
  title?: string
  content: string
}

export interface SopStep {
  id?: string
  sortOrder: number
  title: string
  instruction?: string
  isCritical?: boolean
  estimatedMinutes?: number
  actionKind?: string
  actionPath?: string
  actionLabel?: string
}

export interface SopOverlay {
  id: string
  kind: string
  title: string
  body: string
  clientId?: string
  clientName?: string
  serviceItemId?: string
}

export interface Sop {
  id: string
  name: string
  usageDescription?: string
  procedure?: string
  rules?: string
  category?: string
  procedureType?: string
  applicableArea?: string
  triggerDescription?: string
  defaultResponsible?: string
  slaBusinessDays?: number
  situationAliases?: string[]
  isTemplate?: boolean
  packKey?: string
  serviceItemId?: string
  tags?: string[]
  version?: number
  estimatedMinutes?: number
  outcome?: string
  stepCount?: number
  scriptCount?: number
  runCount?: number
  steps?: SopStep[]
  scripts: SopScript[]
  overlays?: SopOverlay[]
}

export interface SopRun {
  id: string
  sopId: string
  sopName: string
  status: string
  clientId?: string
  clientName?: string
  progress: number
  notes?: string
  wasDelayed?: boolean
  delayNotes?: string
  agendaEventId?: string
  todoItemId?: string
  steps: {
    id: string
    title: string
    instruction?: string
    isCritical: boolean
    isCompleted: boolean
    estimatedMinutes?: number
    actionKind?: string
    actionPath?: string
    actionLabel?: string
  }[]
}

export interface AppItem {
  id: string
  name: string
  homeUrl?: string
  downloadUrl?: string
}

export type TodoStatus = 'Todo' | 'InProgress' | 'Done'

export interface TodoComment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

export interface TodoItem {
  id: string
  title: string
  description?: string
  status: TodoStatus
  boardColumnId?: string
  boardColumnName?: string
  priority?: string
  tags?: string[]
  ownerUserId?: string
  ownerUserName?: string
  clientId?: string
  clientName?: string
  isGeneral: boolean
  dueAtUtc?: string
  dueAtLocal?: string
  displayTimeZoneId?: string
  isOverdue?: boolean
  agendaEventId?: string
  agendaEventTitle?: string
  comments: TodoComment[]
}

export interface EmailAccount {
  id: string
  clientId: string
  clientName: string
  emailAddress: string
  displayName?: string
  provider: string
  isDemo: boolean
}

export interface MailboxMessage {
  id: string
  subject: string
  from: string
  to: string[]
  snippet?: string
  body?: string
  receivedAtUtc: string
  isRead: boolean
  isOutbound?: boolean
  folder: string
}

export interface ScheduledEmail {
  id: string
  clientId: string
  clientName: string
  toAddress: string
  subject: string
  body: string
  status: string
  scheduledAtUtc: string
  scheduledAtLocal?: string
  scheduledInTimeZoneId?: string
  displayTimeZoneId?: string
  sentAtUtc?: string
  providerKey?: string
  error?: string
}

export interface ShareLink {
  id: string
  token: string
  scope: string
  clientId?: string
  clientName?: string
  createdAt: string
  expiresAt?: string
  isActive?: boolean
  allowMessages?: boolean
  allowUploads?: boolean
  shareContactInfo?: boolean
  expired?: boolean
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  sortOrder?: number
  category?: string
  isPublished?: boolean
}

export interface ApiError {
  message?: string
  title?: string
  detail?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
}
