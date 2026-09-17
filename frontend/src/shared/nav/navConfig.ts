import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  UserRound,
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
  { key: 'prestadores', to: '/prestadores', label: 'Prestadores', icon: UserRound, permission: Permissions.EmployeesRead },
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
    keys: ['emails', 'whatsapp', 'chat'],
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
    keys: ['piramide', 'apps', 'faqs', 'compartilhar', 'notificacoes'],
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
    if (!def || p.visible === false) continue
    ordered.push({
      ...def,
      label: p.customLabel?.trim() || def.label,
    })
    byKey.delete(p.key)
  }
  for (const rest of byKey.values()) ordered.push(rest)
  return ordered
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
