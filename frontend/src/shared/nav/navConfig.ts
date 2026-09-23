import type { LucideIcon } from 'lucide-react'
import {
  House,
  LayoutDashboard,
  Users,
  Network,
  Wallet,
  Building2,
  Wrench,
  FileText,
  ListChecks,
  CalendarDays,
  BookOpen,
  AppWindow,
  CheckSquare,
  Share2,
  Mail,
  MessageCircle,
  Bell,
  MessagesSquare,
  Bolt,
  HelpCircle,
  BarChart3,
  LayoutGrid,
} from 'lucide-react'
import type { Permission } from '../permissions/constants'
import { Permissions } from '../permissions/constants'

export interface NavDefinition {
  key: string
  to: string
  label: string
  icon: LucideIcon
  permission?: Permission | Permission[]
  ownerOnly?: boolean
}

export const NAV_DEFINITIONS: NavDefinition[] = [
  { key: 'dashboard', to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: Permissions.Dashboard },
  { key: 'operacao', to: '/operacao', label: 'Modo operação', icon: Bolt, permission: Permissions.Dashboard },
  { key: 'relatorios', to: '/relatorios', label: 'Relatórios', icon: BarChart3, permission: Permissions.Dashboard },
  { key: 'clientes', to: '/clientes', label: 'Clientes', icon: Users, permission: Permissions.ClientsRead },
  { key: 'tarefas', to: '/todos', label: 'Tarefas', icon: CheckSquare, permission: Permissions.TodosRead },
  { key: 'agenda', to: '/agenda', label: 'Agenda', icon: CalendarDays, permission: Permissions.AgendaRead },
  { key: 'emails', to: '/emails', label: 'E-mails', icon: Mail, permission: Permissions.EmailsRead },
  { key: 'whatsapp', to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, permission: Permissions.ClientsRead },
  { key: 'chat', to: '/chat', label: 'Chat interno', icon: MessagesSquare },
  { key: 'notificacoes', to: '/notificacoes', label: 'Alertas', icon: Bell },
  { key: 'financeiro', to: '/financeiro', label: 'Financeiro', icon: Wallet, permission: [Permissions.FinanceOwn, Permissions.FinanceAll] },
  { key: 'onboarding', to: '/onboarding', label: 'Onboarding', icon: ListChecks, permission: Permissions.OnboardingRead },
  { key: 'prestadores', to: '/prestadores', label: 'Minha equipe', icon: Users, permission: Permissions.EmployeesRead },
  { key: 'piramide', to: '/piramide', label: 'Pirâmide', icon: Network, permission: Permissions.PyramidView, ownerOnly: true },
  { key: 'parceiras', to: '/parceiras', label: 'Parceiras', icon: Building2, permission: Permissions.PartnersRead },
  { key: 'servicos', to: '/servicos', label: 'Serviços', icon: Wrench, permission: Permissions.ServicesRead },
  { key: 'contratos', to: '/contratos', label: 'Contratos', icon: FileText, permission: Permissions.ContractsRead },
  { key: 'sops', to: '/sops', label: 'Procedimentos', icon: BookOpen, permission: Permissions.SopsRead },
  { key: 'apps', to: '/apps', label: 'Apps', icon: AppWindow, permission: Permissions.AppsRead },
  { key: 'faqs', to: '/faqs', label: 'FAQs', icon: HelpCircle, permission: Permissions.FaqsRead },
  {
    key: 'compartilhar',
    to: '/compartilhar',
    label: 'Portal contratante',
    icon: Share2,
    permission: Permissions.ShareLinks,
  },
]

export interface MenuPreferenceItem {
  key: string
  visible: boolean
  customLabel?: string | null
}

export interface NavGroup {
  id: string
  label: string
  collapsible: boolean
  icon: LucideIcon
  keys: string[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'principal',
    label: 'Principal',
    collapsible: false,
    icon: LayoutDashboard,
    keys: ['dashboard', 'operacao', 'agenda'],
  },
  {
    id: 'gestao',
    label: 'Gestão',
    collapsible: true,
    icon: Users,
    keys: ['clientes', 'prestadores', 'parceiras', 'servicos', 'contratos'],
  },
  {
    id: 'operacao-group',
    label: 'Operação',
    collapsible: true,
    icon: ListChecks,
    keys: ['tarefas', 'sops', 'onboarding'],
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    collapsible: true,
    icon: MessagesSquare,
    keys: ['emails', 'whatsapp'],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    collapsible: true,
    icon: Wallet,
    keys: ['financeiro', 'relatorios'],
  },
  {
    id: 'mais',
    label: 'Mais',
    collapsible: true,
    icon: LayoutGrid,
    keys: ['piramide', 'apps', 'faqs', 'compartilhar'],
  },
]

export function resolveMenu(
  prefs: MenuPreferenceItem[] | undefined,
  allowed: NavDefinition[],
): NavDefinition[] {
  if (!prefs?.length) return allowed
  const byKey = new Map(allowed.map((i) => [i.key, i]))
  const ordered: NavDefinition[] = []
  for (const p of prefs) {
    const def = byKey.get(p.key)
    if (!def) continue
    byKey.delete(p.key)
    if (p.visible === false) continue
    ordered.push({
      ...def,
      label: p.customLabel?.trim() || def.label,
    })
  }
  for (const rest of byKey.values()) ordered.push(rest)
  return ordered
}

export type MobileTabDef =
  | { id: string; label: string; icon: LucideIcon; key: string; to: string; end?: boolean }
  | { id: string; label: string; icon: LucideIcon; keys: string[] }

export const MOBILE_TAB_DEFS: MobileTabDef[] = [
  { id: 'inicio', label: 'Início', icon: House, key: 'dashboard', to: '/', end: true },
  { id: 'tarefas', label: 'Tarefas', icon: CheckSquare, key: 'tarefas', to: '/todos' },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays, key: 'agenda', to: '/agenda' },
  { id: 'clientes', label: 'Clientes', icon: Users, key: 'clientes', to: '/clientes' },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, key: 'financeiro', to: '/financeiro' },
]

function usedMobileKeys() {
  const used = new Set<string>(['chat', 'notificacoes'])
  for (const tab of MOBILE_TAB_DEFS) {
    if ('to' in tab) used.add(tab.key)
    else tab.keys.forEach((key) => used.add(key))
  }
  return used
}

export function mobileTabs(visible: NavDefinition[]) {
  const byKey = new Map(visible.map((item) => [item.key, item]))
  return MOBILE_TAB_DEFS.flatMap((tab) => {
    if ('to' in tab) {
      if (!byKey.has(tab.key)) return []
      return [{ id: tab.id, label: tab.label, icon: tab.icon, to: tab.to, end: Boolean(tab.end) }]
    }
    const items = tab.keys.map((key) => byKey.get(key)).filter((item): item is NavDefinition => Boolean(item))
    if (items.length === 0) return []
    if (items.length === 1) {
      return [{ id: tab.id, label: tab.label, icon: items[0].icon, to: items[0].to, end: false }]
    }
    return []
  })
}

export function mobileMoreSections(visible: NavDefinition[]) {
  const byKey = new Map(visible.map((item) => [item.key, item]))
  const used = usedMobileKeys()
  const sections = NAV_GROUPS.map((group) => ({
    ...group,
    collapsible: true,
    items: group.keys
      .filter((key) => !used.has(key))
      .map((key) => byKey.get(key))
      .filter((item): item is NavDefinition => Boolean(item)),
  }))
  const principal = sections.find((group) => group.id === 'principal')
  const operacao = sections.find((group) => group.id === 'operacao-group')
  if (principal && operacao && principal.items.length) {
    operacao.items = [...principal.items, ...operacao.items]
    principal.items = []
  }
  return sections.filter((group) => group.items.length > 0)
}

export function groupedNav(visible: NavDefinition[]) {
  const byKey = new Map(visible.map((item) => [item.key, item]))
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.keys.map((key) => byKey.get(key)).filter((item): item is NavDefinition => Boolean(item)),
  })).filter((group) => group.items.length > 0)
}

export function navGroupIdForPath(pathname: string): string | null {
  for (const group of NAV_GROUPS) {
    for (const key of group.keys) {
      const def = NAV_DEFINITIONS.find((item) => item.key === key)
      if (!def) continue
      if (def.to === '/') {
        if (pathname === '/') return group.id
        continue
      }
      if (pathname === def.to || pathname.startsWith(`${def.to}/`)) return group.id
    }
  }
  return null
}
