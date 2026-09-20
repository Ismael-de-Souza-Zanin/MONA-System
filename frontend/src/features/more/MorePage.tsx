import { Link } from 'react-router-dom'
import { useAuth } from '../../shared/auth/AuthContext'
import { usePermissions } from '../../shared/permissions/hooks'
import { NAV_DEFINITIONS, groupedNav, resolveMenu } from '../../shared/nav/navConfig'
import { useUserPreferences } from '../../shared/hooks/useWorkspaceData'
import { MobileHero, MobileSection, MobileTip } from '../../shared/ui'

const BLURBS: Record<string, string> = {
  operacao: 'Defina como você trabalha',
  sops: 'Padronize e escale',
  onboarding: 'Estruture a entrada de novos clientes',
  prestadores: 'Gerencie sua equipe externa',
  parceiras: 'Suas parcerias estratégicas',
  servicos: 'Configure seus serviços',
  contratos: 'Modelos e gestão de contratos',
  emails: 'Gestão de comunicação',
  whatsapp: 'Atendimento mais ágil',
  relatorios: 'Análises e resultados',
  piramide: 'Acompanhe seu progresso',
  apps: 'Integrações e aplicativos',
  faqs: 'Dúvidas frequentes',
  compartilhar: 'Acesso para seus clientes',
  chat: 'Conversa da equipe',
  notificacoes: 'O que pede atenção',
}

const HIDDEN_IN_HUB = new Set(['dashboard', 'tarefas', 'agenda', 'clientes', 'financeiro'])

export function MorePage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { preferences } = useUserPreferences()
  const allowed = NAV_DEFINITIONS.filter((item) => {
    if (item.ownerOnly && !user?.isOwner) return false
    if (!item.permission) return true
    return hasPermission(item.permission)
  })
  const visible = resolveMenu(preferences?.menuItems, allowed)
  const sections = groupedNav(visible)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !HIDDEN_IN_HUB.has(item.key)),
    }))
  const principal = sections.find((section) => section.id === 'principal')
  const operacao = sections.find((section) => section.id === 'operacao-group')
  if (principal && operacao && principal.items.length) {
    operacao.items = [...principal.items, ...operacao.items]
    principal.items = []
  }
  const visibleSections = sections.filter((section) => section.items.length > 0)

  return (
    <div className="mona-m-stack">
      <MobileHero
        kicker="Mais"
        title="Tudo o que você precisa, em um só lugar"
        lead="Acesse ferramentas, configurações e recursos para tornar a gestão do seu negócio ainda mais simples."
        note="Mais possibilidade para o seu crescimento"
      />

      {visibleSections.map((section) => (
        <MobileSection key={section.id} title={section.label}>
          <div className={`mona-m-apps${section.items.length >= 4 ? ' is-4' : section.items.length === 2 ? ' is-2' : ''}`}>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.key} to={item.to} className="mona-m-app">
                  <span className="mona-m-icon">
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <strong>{item.label}</strong>
                  <p>{BLURBS[item.key] || 'Abrir módulo'}</p>
                </Link>
              )
            })}
          </div>
        </MobileSection>
      ))}

      <MobileTip to="/sops">Padronize seus processos hoje e garanta um amanhã mais leve e escalável.</MobileTip>
    </div>
  )
}
