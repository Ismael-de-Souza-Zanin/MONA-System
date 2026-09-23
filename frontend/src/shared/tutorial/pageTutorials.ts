export type PageTutorial = {
  key: string
  title: string
  lead: string
  tips: string[]
}

/** Tutorials keyed by the first path segment (or `home` for `/`). */
export const PAGE_TUTORIALS: Record<string, PageTutorial> = {
  home: {
    key: 'home',
    title: 'Dashboard',
    lead: 'Visão geral do dia: o que precisa de atenção agora.',
    tips: [
      'Acompanhe indicadores de clientes, tarefas e financeiro.',
      'Use os atalhos para ir direto à agenda, tarefas ou onboarding.',
      'Volte aqui sempre que quiser um panorama rápido da operação.',
    ],
  },
  operacao: {
    key: 'operacao',
    title: 'Modo operação',
    lead: 'O dia em modo foco: execute sem se perder.',
    tips: [
      'Priorize o que está em andamento e o que vence hoje.',
      'Marque conclusões aqui para manter o ritmo do time.',
      'Combine com Agenda e Tarefas para não deixar nada cair.',
    ],
  },
  relatorios: {
    key: 'relatorios',
    title: 'Relatórios',
    lead: 'Números e tendências da operação, em um só lugar.',
    tips: [
      'Compare períodos para ver evolução de clientes e receita.',
      'Use os filtros antes de exportar ou compartilhar.',
      'Relatórios ajudam a decidir onde colocar energia na semana.',
    ],
  },
  clientes: {
    key: 'clientes',
    title: 'Clientes',
    lead: 'Cada cliente com histórico, tarefas e financeiro juntos.',
    tips: [
      'Abra um cliente para ver visão geral, tarefas e arquivos.',
      'Na aba Equipe, veja e vincule quem atende esse cliente.',
      'O detalhe do cliente é o centro da operação na MONA.',
    ],
  },
  todos: {
    key: 'todos',
    title: 'Tarefas',
    lead: 'O que precisa ser feito — por você ou pelo time.',
    tips: [
      'Organize por status: a fazer, em andamento e concluído.',
      'Vincule tarefas a clientes quando fizer sentido.',
      'Use a agenda do dia ao lado para equilibrar demandas.',
    ],
  },
  agenda: {
    key: 'agenda',
    title: 'Agenda',
    lead: 'Compromissos e entregas do dia, na linha do tempo.',
    tips: [
      'Crie eventos e lembretes para não perder horários.',
      'Alinhe a agenda com as tarefas do dia.',
      'Revise amanhã no fim do expediente para planejar melhor.',
    ],
  },
  emails: {
    key: 'emails',
    title: 'E-mails',
    lead: 'Caixa da operação centralizada na MONA.',
    tips: [
      'Trate conversas importantes sem sair do contexto do cliente.',
      'Use pastas e filtros para manter a inbox leve.',
      'Registre follow-ups como tarefas quando necessário.',
    ],
  },
  whatsapp: {
    key: 'whatsapp',
    title: 'WhatsApp',
    lead: 'Conversas da operação no mesmo fluxo de trabalho.',
    tips: [
      'Atenda clientes sem perder o histórico na MONA.',
      'Encaminhe demandas para tarefas ou agenda.',
      'Mantenha o tom profissional: a conversa fica no registro.',
    ],
  },
  chat: {
    key: 'chat',
    title: 'Chat interno',
    lead: 'Alinhamento rápido entre o time.',
    tips: [
      'Use para combinar prioridades do dia.',
      'Evite espalhar decisões só no chat: registre na tarefa ou SOP.',
      'O widget flutuante também abre o chat em outras páginas.',
    ],
  },
  notificacoes: {
    key: 'notificacoes',
    title: 'Alertas',
    lead: 'O que a MONA quer que você veja agora.',
    tips: [
      'Priorize alertas de prazo e financeiro.',
      'Marque como lido o que já tratou.',
      'Ajuste preferências em Configurações se houver ruído.',
    ],
  },
  financeiro: {
    key: 'financeiro',
    title: 'Financeiro',
    lead: 'Cobranças, recebidos e pendências da operação.',
    tips: [
      'Acompanhe o que está a receber e o que já entrou.',
      'Cruze com o cliente para ver o contexto completo.',
      'Use relatórios quando precisar de visão mensal.',
    ],
  },
  onboarding: {
    key: 'onboarding',
    title: 'Onboarding',
    lead: 'Entrada de novos clientes e assistentes, passo a passo.',
    tips: [
      'Aplique um checklist para não esquecer etapas.',
      'Marque itens concluídos conforme avança.',
      'Um onboarding bem feito reduz retrabalho depois.',
    ],
  },
  prestadores: {
    key: 'prestadores',
    title: 'Minha equipe',
    lead: 'Assistentes e colaboradores que executam com você.',
    tips: [
      'Cadastre pessoas do time e vincule clientes — ou faça o vínculo na ficha do cliente.',
      'Abra o resumo individual para ver carga e histórico.',
      'Combine com a pirâmide para visão de estrutura.',
    ],
  },
  piramide: {
    key: 'piramide',
    title: 'Pirâmide',
    lead: 'Estrutura e hierarquia da operação.',
    tips: [
      'Visualize quem responde a quem.',
      'Use para planejar crescimento sem perder clareza.',
      'Disponível conforme seu perfil de acesso.',
    ],
  },
  parceiras: {
    key: 'parceiras',
    title: 'Parceiras',
    lead: 'Empresas e parceiros ligados à sua operação.',
    tips: [
      'Mantenha contatos e status atualizados.',
      'Relate parceiras a clientes e serviços quando couber.',
      'Isso facilita cobranças e comunicação depois.',
    ],
  },
  servicos: {
    key: 'servicos',
    title: 'Serviços',
    lead: 'O catálogo do que você oferece.',
    tips: [
      'Cadastre serviços com clareza de escopo.',
      'Use nos contratos e no financeiro.',
      'Revise periodicamente o que ainda faz sentido vender.',
    ],
  },
  contratos: {
    key: 'contratos',
    title: 'Contratos',
    lead: 'Documentos e acordos da operação, reunidos.',
    tips: [
      'Vincule contratos ao cliente certo.',
      'Acompanhe status e renovações.',
      'Arquivos ficam acessíveis no detalhe do cliente também.',
    ],
  },
  sops: {
    key: 'sops',
    title: 'Procedimentos',
    lead: 'Como o time executa: o padrão escrito.',
    tips: [
      'Crie SOPs para processos que se repetem.',
      'Atualize quando o fluxo mudar de verdade.',
      'Procedimentos bons aceleram onboarding de pessoas novas.',
    ],
  },
  apps: {
    key: 'apps',
    title: 'Apps',
    lead: 'Ferramentas e atalhos conectados à MONA.',
    tips: [
      'Abra apps usados no dia a dia sem sair do contexto.',
      'Organize o que o time realmente usa.',
      'Menos abas soltas, mais operação no mesmo lugar.',
    ],
  },
  faqs: {
    key: 'faqs',
    title: 'FAQs',
    lead: 'Respostas prontas para dúvidas recorrentes.',
    tips: [
      'Cadastre perguntas que o time ou o cliente sempre faz.',
      'Use no atendimento para responder mais rápido.',
      'Atualize quando a resposta mudar.',
    ],
  },
  compartilhar: {
    key: 'compartilhar',
    title: 'Portal do contratante',
    lead: 'Links e acesso compartilhado com quem contrata.',
    tips: [
      'Gere links seguros para o que o cliente precisa ver.',
      'Revogue acessos quando o projeto terminar.',
      'Menos ida e volta de arquivo por WhatsApp.',
    ],
  },
  configuracoes: {
    key: 'configuracoes',
    title: 'Configurações',
    lead: 'Aparência, preferências e ajustes da conta.',
    tips: [
      'Personalize tema e menu para o seu jeito de trabalhar.',
      'Revise permissões e dados do perfil.',
      'Aqui também dá para reabrir tutoriais das páginas.',
    ],
  },
  mais: {
    key: 'mais',
    title: 'Mais',
    lead: 'Atalhos para o restante da MONA no celular.',
    tips: [
      'Tudo que não está na barra inferior fica aqui.',
      'Personalize o que aparece no menu em Configurações.',
      'No desktop, a lateral cobre a mesma navegação.',
    ],
  },
}

const STORAGE_KEY = 'mona_page_tutorials_v1'

export function tutorialKeyFromPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/') return 'home'
  const segment = clean.split('/').filter(Boolean)[0] || 'home'
  return segment
}

export function getTutorialForPath(pathname: string): PageTutorial | null {
  const key = tutorialKeyFromPath(pathname)
  return PAGE_TUTORIALS[key] ?? null
}

function readSeen(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeSeen(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function hasSeenTutorial(key: string): boolean {
  return Boolean(readSeen()[key])
}

export function markTutorialSeen(key: string) {
  const map = readSeen()
  map[key] = true
  writeSeen(map)
}

export function resetTutorial(key: string) {
  const map = readSeen()
  delete map[key]
  writeSeen(map)
}

export function resetAllTutorials() {
  localStorage.removeItem(STORAGE_KEY)
}

export const TUTORIAL_REOPEN_EVENT = 'mona:tutorial-reopen'
