type Json = Record<string, unknown>

type HttpResult = { status: number; body?: unknown }

type RouteCtx = {
  params: Record<string, string>
  query: URLSearchParams
  body: Json
}

type Route = {
  method: string
  pattern: string
  handle: (ctx: RouteCtx) => unknown
}

const PERMISSIONS = [
  'Dashboard',
  'Clients.Read',
  'Clients.Write',
  'Employees.Read',
  'Employees.Write',
  'Pyramid.View',
  'Finance.Own',
  'Finance.All',
  'Partners.Read',
  'Partners.Write',
  'Services.Read',
  'Services.Write',
  'Contracts.Read',
  'Contracts.Write',
  'Onboarding.Read',
  'Onboarding.Write',
  'Agenda.Read',
  'Agenda.Write',
  'Agenda.Others',
  'Sops.Read',
  'Sops.Write',
  'Apps.Read',
  'Apps.Write',
  'Todos.Read',
  'Todos.Write',
  'Todos.All',
  'Settings',
  'ShareLinks',
  'Profiles',
  'Categories',
  'Emails.Read',
  'Emails.Write',
  'Emails.Send',
  'Faqs.Read',
  'Faqs.Write',
]

const USER = {
  id: 'u-ju',
  name: 'Juliana',
  email: 'ju@fattovirtual.com',
  organizationId: 'org-fatto',
  isOwner: true,
  permissions: PERMISSIONS,
  assignedClientIds: ['c-ana', 'c-bruno', 'c-clara'],
}

const TOKENS = {
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
}

function nid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function iso(offsetHours = 0) {
  return new Date(Date.now() + offsetHours * 3600_000).toISOString()
}

function atHour(hour: number, minute = 0, dayOffset = 0) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function inMinutes(mins: number) {
  return new Date(Date.now() + mins * 60_000).toISOString()
}

function asJson(body: unknown): Json {
  if (Array.isArray(body)) return { items: body }
  return body && typeof body === 'object' ? (body as Json) : {}
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean)
  const b = path.split('/').filter(Boolean)
  if (a.length !== b.length) return null
  const params: Record<string, string> = {}
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i])
    else if (a[i] !== b[i]) return null
  }
  return params
}

function findById<T extends { id: string }>(rows: T[], id: string) {
  return rows.find((row) => row.id === id)
}

function requireRow<T extends { id: string }>(rows: T[], id: string) {
  const row = findById(rows, id)
  if (!row) {
    const err = new Error('not-found') as Error & { status: number }
    err.status = 404
    throw err
  }
  return row
}

const db = seed()

function seed() {
  const prefs = {
    timeZoneId: 'America/Sao_Paulo',
    homeTimeZoneId: 'America/Sao_Paulo',
    detectedTimeZoneId: 'America/Sao_Paulo',
    travelModeEnabled: false,
    travelTimeZoneId: undefined as string | undefined,
    travelLabel: undefined as string | undefined,
    travelEndsAtUtc: undefined as string | undefined,
    effectiveTimeZoneId: 'America/Sao_Paulo',
    isAwayFromHome: false,
    menuItems: [] as { key: string; visible: boolean; customLabel?: string | null }[],
  }

  const org = {
    id: 'org-fatto',
    name: 'Fatto Virtual',
    document: '12.345.678/0001-90',
    phone: '+55 11 99999-0000',
    email: 'contato@fattovirtual.com',
    address: 'São Paulo, SP',
    whatsAppSupportUrl: 'https://wa.me/5511999999999',
    kind: 'Agency',
    defaultTimeZoneId: 'America/Sao_Paulo',
  }

  const groups = [
    { id: 'g-vip', name: 'VIP', description: 'Clientes prioritários', color: '#0F4C5C', sortOrder: 1, clientCount: 2 },
    { id: 'g-rotina', name: 'Rotina', description: 'Operação semanal', color: '#C4A574', sortOrder: 2, clientCount: 1 },
  ]

  const clients = [
    {
      id: 'c-ana',
      name: 'Ana Beatriz Lima',
      phone: '+55 11 98888-1001',
      companyName: 'Studio Lima',
      status: 'Active',
      email: 'ana@studiolima.com',
      appsUsed: 'Notion, Gmail',
      crm: 'Lead quente — quer ampliar o pacote',
      segment: 'Estética',
      document: '123.456.789-00',
      address: 'Pinheiros, São Paulo',
      financeNotes: 'Mensalidade dia 10',
      contractNotes: 'Contrato anual',
      invoicesNotes: '',
      serviceWorkNotes: 'Agenda da semana às segundas',
      additionalNotes: 'Prefere WhatsApp',
      loginsNotes: 'Senhas no cofre',
      contractCode: 'FV-2026-001',
      contractRenewalDate: '2026-12-01',
      timeZoneId: 'America/Sao_Paulo',
      clientGroupId: 'g-vip',
      clientGroupName: 'VIP',
      clientGroupColor: '#0F4C5C',
      tags: ['vip', 'estetica'],
      preferredLanguage: 'pt-BR',
      marketCountry: 'BR',
      needsQuickResponse: true,
      onboardingCompleted: false,
      createdAt: iso(-24 * 40),
      relationshipStage: 'Ativo',
      nextAction: 'Confirmar pagamento da mensalidade',
      nextActionAtUtc: iso(8),
      lastContactAtUtc: iso(-6),
      retainerHoursPerMonth: 12,
    },
    {
      id: 'c-bruno',
      name: 'Bruno Carvalho',
      phone: '+55 21 97777-2002',
      companyName: 'Carvalho Advogados',
      status: 'Active',
      email: 'bruno@carvalho.adv.br',
      appsUsed: 'Outlook, Trello',
      crm: 'Aguardando documentos do contrato',
      segment: 'Jurídico',
      clientGroupId: 'g-vip',
      clientGroupName: 'VIP',
      clientGroupColor: '#0F4C5C',
      tags: ['juridico'],
      needsQuickResponse: false,
      onboardingCompleted: true,
      createdAt: iso(-24 * 90),
      relationshipStage: 'Retenção',
      lastContactAtUtc: iso(-20),
      retainerHoursPerMonth: 10,
    },
    {
      id: 'c-clara',
      name: 'Clara Mendes',
      phone: '+55 11 96666-3003',
      companyName: 'Mendes Store',
      status: 'Notice',
      email: 'clara@mendes.store',
      appsUsed: 'Shopify, Instagram',
      crm: 'Pediu pausa no final do mês',
      segment: 'Varejo',
      clientGroupId: 'g-rotina',
      clientGroupName: 'Rotina',
      clientGroupColor: '#C4A574',
      tags: ['varejo'],
      needsQuickResponse: false,
      onboardingCompleted: true,
      createdAt: iso(-24 * 20),
      relationshipStage: 'Risco',
      retainerHoursPerMonth: 8,
    },
  ]

  const topics = [
    { id: 't-1', clientId: 'c-ana', title: 'Rotina semanal', content: 'Segunda: agenda e caixa. Quarta: conteúdo.' },
    { id: 't-2', clientId: 'c-bruno', title: 'Prazos', content: 'Petições sempre com 48h de antecedência.' },
  ]
  const credentials = [
    { id: 'cred-1', clientId: 'c-ana', appName: 'Gmail', login: 'ana@studiolima.com', password: 'fake-password' },
  ]
  const clientApps = [{ id: 'capp-1', clientId: 'c-ana', name: 'Notion', appId: 'app-notion' }]
  const invoices = [
    {
      id: 'inv-1',
      clientId: 'c-ana',
      reference: '2026-09',
      amount: 2800,
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
      status: 'Pending',
      kind: 'Retainer',
      counterpartyName: 'Studio Lima',
      dueDate: '2026-09-10',
    },
  ]
  const crmEntries = [
    {
      id: 'crm-1',
      clientId: 'c-ana',
      kind: 'WhatsApp',
      summary: 'Confirmou presença na reunião de quinta.',
      channel: 'whatsapp',
      createdByName: 'Juliana',
      createdAt: iso(-10),
    },
  ]
  const portalMessages = [
    {
      id: 'pm-1',
      clientId: 'c-ana',
      body: 'Oi Ju, consegue me mandar o extrato da semana?',
      fromContractor: true,
      authorLabel: 'Ana Beatriz',
      createdAt: iso(-4),
    },
  ]
  const documents = [
    {
      id: 'doc-1',
      clientId: 'c-ana',
      title: 'Comprovante setembro',
      fileName: 'comprovante-set.pdf',
      kind: 'Proof',
      uploadedBy: 'contractor',
      uploaderLabel: 'Ana Beatriz',
      createdAt: iso(-30),
    },
  ]

  const employees = [
    { id: 'e-marina', name: 'Marina Souza', phone: '+55 11 91111-0001', email: 'marina@fattovirtual.com', color: '#0F4C5C', status: 'Active', managerId: null },
    { id: 'e-paulo', name: 'Paulo Henrique', phone: '+55 11 92222-0002', email: 'paulo@fattovirtual.com', color: '#C4A574', status: 'Active', managerId: 'e-marina' },
  ]
  const employeeClients: { employeeId: string; clientId: string }[] = [
    { employeeId: 'e-marina', clientId: 'c-ana' },
    { employeeId: 'e-paulo', clientId: 'c-bruno' },
  ]

  const columns = [
    { id: 'col-todo', name: 'A fazer', color: '#94A3B8', sortOrder: 1, marksComplete: false },
    { id: 'col-doing', name: 'Em andamento', color: '#0F4C5C', sortOrder: 2, marksComplete: false },
    { id: 'col-done', name: 'Concluído', color: '#059669', sortOrder: 3, marksComplete: true },
  ]

  const todos = [
    {
      id: 'todo-1',
      title: 'Fechar caixa da Ana',
      description: 'Conferir mensalidade e enviar relatório.',
      status: 'InProgress',
      boardColumnId: 'col-doing',
      boardColumnName: 'Em andamento',
      priority: 'High',
      tags: ['financeiro'],
      ownerUserId: 'u-ju',
      ownerUserName: 'Juliana',
      clientId: 'c-ana',
      clientName: 'Ana Beatriz Lima',
      isGeneral: false,
      dueAtUtc: iso(6),
      dueAtLocal: iso(6),
      displayTimeZoneId: 'America/Sao_Paulo',
      isOverdue: false,
      comments: [{ id: 'tc-1', authorName: 'Marina Souza', content: 'Já separei os comprovantes.', createdAt: iso(-2) }],
    },
    {
      id: 'todo-2',
      title: 'Renovar contrato do Bruno',
      description: 'Enviar minuta atualizada.',
      status: 'Todo',
      boardColumnId: 'col-todo',
      boardColumnName: 'A fazer',
      priority: 'Normal',
      tags: ['contrato'],
      ownerUserId: 'u-ju',
      ownerUserName: 'Juliana',
      clientId: 'c-bruno',
      clientName: 'Bruno Carvalho',
      isGeneral: false,
      dueAtUtc: iso(-12),
      dueAtLocal: iso(-12),
      isOverdue: true,
      comments: [],
    },
    {
      id: 'todo-3',
      title: 'Organizar inbox geral',
      status: 'Todo',
      boardColumnId: 'col-todo',
      boardColumnName: 'A fazer',
      priority: 'Normal',
      ownerUserId: 'u-ju',
      ownerUserName: 'Juliana',
      isGeneral: true,
      comments: [],
    },
    {
      id: 'todo-4',
      title: 'Enviar relatório semanal da Clara',
      description: 'Resumo de vendas e inbox.',
      status: 'Done',
      boardColumnId: 'col-done',
      boardColumnName: 'Concluído',
      priority: 'Normal',
      ownerUserId: 'u-ju',
      ownerUserName: 'Juliana',
      clientId: 'c-clara',
      clientName: 'Clara Mendes',
      isGeneral: false,
      updatedAt: iso(-6),
      comments: [],
    },
  ]

  const categories = [
    { id: 'cat-reuniao', name: 'Reunião', color: '#0F4C5C' },
    { id: 'cat-pessoal', name: 'Pessoal', color: '#C4A574' },
  ]

  const events = [
    {
      id: 'ev-1',
      title: 'Reunião de alinhamento',
      startAt: atHour(9),
      endAt: atHour(9, 45),
      startAtUtc: atHour(9),
      endAtUtc: atHour(9, 45),
      timeZoneId: 'America/Sao_Paulo',
      displayTimeZoneId: 'America/Sao_Paulo',
      remindMinutesBefore: 30,
      categoryId: 'cat-reuniao',
      categoryName: 'Reunião',
      categoryColor: '#582B86',
      responsibleUserId: 'u-ju',
      responsibleUserName: 'Juliana',
      clientId: 'c-clara',
      clientName: 'Carla Mendes',
      kind: 'Meeting',
      startsAt: atHour(9),
      description: 'Presencial · Escritório',
      linkedTodos: [{ id: 'todo-1', title: 'Fechar caixa da Ana', status: 'InProgress' }],
    },
    {
      id: 'ev-2',
      title: 'Proposta comercial',
      startAt: atHour(11),
      endAt: atHour(12),
      startAtUtc: atHour(11),
      endAtUtc: atHour(12),
      timeZoneId: 'America/Sao_Paulo',
      displayTimeZoneId: 'America/Sao_Paulo',
      categoryId: 'cat-reuniao',
      categoryName: 'Comercial',
      categoryColor: '#FF7A33',
      responsibleUserId: 'u-ju',
      responsibleUserName: 'Juliana',
      clientId: 'c-bruno',
      clientName: 'Rafael Costa',
      kind: 'Meeting',
      description: 'Videocall',
    },
    {
      id: 'ev-3',
      title: 'Acompanhamento mensal',
      startAt: atHour(14),
      endAt: atHour(15),
      startAtUtc: atHour(14),
      endAtUtc: atHour(15),
      timeZoneId: 'America/Sao_Paulo',
      displayTimeZoneId: 'America/Sao_Paulo',
      categoryId: 'cat-reuniao',
      categoryName: 'Acompanhamento',
      categoryColor: '#F54D7D',
      responsibleUserId: 'u-ju',
      responsibleUserName: 'Juliana',
      clientId: 'c-ana',
      clientName: 'Ana Beatriz Lima',
      kind: 'Event',
      description: 'Videocall',
    },
    {
      id: 'ev-4',
      title: 'Consultoria financeira',
      startAt: inMinutes(50),
      endAt: inMinutes(110),
      startAtUtc: inMinutes(50),
      endAtUtc: inMinutes(110),
      timeZoneId: 'America/Sao_Paulo',
      displayTimeZoneId: 'America/Sao_Paulo',
      categoryId: 'cat-reuniao',
      categoryName: 'Consultoria',
      categoryColor: '#582B86',
      responsibleUserId: 'u-ju',
      responsibleUserName: 'Juliana',
      clientId: 'c-bruno',
      clientName: 'Bruno Almeida',
      kind: 'Meeting',
      description: 'Videocall',
    },
    {
      id: 'ev-5',
      title: 'Planejamento da próxima semana',
      startAt: atHour(18),
      endAt: atHour(18, 30),
      startAtUtc: atHour(18),
      endAtUtc: atHour(18, 30),
      timeZoneId: 'America/Sao_Paulo',
      displayTimeZoneId: 'America/Sao_Paulo',
      categoryName: 'Interno',
      categoryColor: '#8B4BB8',
      responsibleUserId: 'u-ju',
      responsibleUserName: 'Juliana',
      kind: 'Event',
      description: 'Videocall',
    },
  ]

  const payments = [
    {
      id: 'pay-1',
      amount: 2800,
      description: 'Retainer setembro — Studio Lima',
      paidAt: null,
      dueDate: '2026-09-16',
      createdAt: iso(-8),
      ledger: 'ClientAr',
      counterpartyName: 'Studio Lima',
      category: 'Retainer',
      clientId: 'c-ana',
      clientName: 'Ana Beatriz Lima',
      status: 'Pending',
      links: [{ kind: 'todo', entityId: 'todo-1', label: 'Fechar caixa da Ana', path: '/todos' }],
    },
    {
      id: 'pay-2',
      amount: 1200,
      description: 'Pagamento Marina — quinzena',
      paidAt: iso(-48),
      dueDate: '2026-09-05',
      ledger: 'Agency',
      counterpartyName: 'Marina Souza',
      employeeId: 'e-marina',
      employeeName: 'Marina Souza',
      status: 'Paid',
      settleMethod: 'Pix',
      links: [],
    },
    {
      id: 'pay-3',
      amount: 900,
      description: 'Repasse Marina — semana',
      paidAt: iso(-20),
      dueDate: '2026-09-15',
      ledger: 'AssistantPayout',
      counterpartyName: 'Marina Souza',
      employeeId: 'e-marina',
      employeeName: 'Marina Souza',
      status: 'Paid',
      settleMethod: 'Pix',
      links: [],
    },
  ]

  const partners = [
    {
      id: 'pt-1',
      name: 'Alves Contabilidade',
      responsibleName: 'Fernanda Alves',
      contact: 'fernanda@alvescontabil.com',
      service: 'Fiscal',
      notes: 'Fecha o mês até o dia 8',
      clients: [{ clientId: 'c-bruno', clientName: 'Bruno Carvalho', status: 'Active', notes: 'Imposto de renda' }],
    },
  ]

  const services = [
    {
      id: 'svc-1',
      title: 'Secretariado executivo',
      description: 'Caixa, agenda e follow-up diário.',
      category: 'Operação',
      specificities: ['WhatsApp', 'E-mail'],
      assistantNotes: 'Sempre confirmar horário no fuso do cliente.',
      clientFacingNotes: 'Resposta em até 2h úteis.',
      isActive: true,
      clients: [{ clientId: 'c-ana', clientName: 'Ana Beatriz Lima', status: 'Active', customNotes: '' }],
    },
    {
      id: 'svc-2',
      title: 'Gestão de conteúdo',
      description: 'Calendário e revisão de posts.',
      category: 'Marketing',
      isActive: true,
      clients: [],
    },
  ]

  const contracts = [
    {
      id: 'ct-1',
      name: 'Contrato de secretariado',
      type: 'Client',
      status: 'Active',
      clientId: 'c-ana',
      partyName: 'Ana Beatriz Lima',
      partyPath: '/clientes/c-ana',
    },
    {
      id: 'ct-2',
      name: 'Contrato de colaboração',
      type: 'Provider',
      status: 'Active',
      employeeId: 'e-marina',
      partyName: 'Marina Souza',
      partyPath: '/prestadores/e-marina',
    },
  ]

  const onboardingItems = [
    { id: 'ob-1', clientId: 'c-ana', title: 'Kickoff e acessos', isCompleted: true, sortOrder: 1 },
    { id: 'ob-2', clientId: 'c-ana', title: 'Mapear rotina semanal', isCompleted: false, sortOrder: 2 },
    { id: 'ob-3', clientId: 'c-ana', title: 'Cadastrar financeiro', isCompleted: false, sortOrder: 3 },
  ]
  const templates = [
    { id: 'tpl-1', name: 'Onboarding padrão', items: ['Kickoff', 'Acessos', 'Agenda', 'Financeiro'] },
  ]

  const sops = [
    {
      id: 'sop-1',
      name: 'Cliente não respondeu',
      usageDescription: 'Quando o follow-up passa de 48h',
      procedure: 'Tentar WhatsApp, depois e-mail, depois ligar.',
      category: 'Atendimento',
      procedureType: 'Situação',
      applicableArea: 'Clientes',
      triggerDescription: 'Sem resposta em 48h',
      defaultResponsible: 'Juliana',
      slaBusinessDays: 1,
      situationAliases: ['Cliente não respondeu'],
      tags: ['follow-up'],
      version: 1,
      estimatedMinutes: 20,
      outcome: 'Contato registrado no CRM',
      stepCount: 3,
      scriptCount: 1,
      runCount: 1,
      steps: [
        { id: 'ss-1', sortOrder: 1, title: 'Checar último contato', instruction: 'Ver WhatsApp e e-mail', isCritical: true, estimatedMinutes: 5 },
        { id: 'ss-2', sortOrder: 2, title: 'Enviar follow-up', instruction: 'Usar o script curto', isCritical: true, estimatedMinutes: 5 },
        { id: 'ss-3', sortOrder: 3, title: 'Registrar no CRM', isCritical: false, estimatedMinutes: 5 },
      ],
      scripts: [{ id: 'sc-1', type: 'whatsapp', title: 'Follow-up 48h', content: 'Oi! Passando para alinhar o que ficou pendente. Pode me retornar hoje?' }],
      overlays: [],
    },
    {
      id: 'sop-2',
      name: 'Fechamento mensal',
      usageDescription: 'Todo dia 1',
      procedure: 'Conferir pagamentos, enviar extrato, atualizar planilha.',
      category: 'Financeiro',
      procedureType: 'Rotina',
      applicableArea: 'Financeiro',
      tags: ['mensal'],
      version: 1,
      estimatedMinutes: 40,
      stepCount: 2,
      scriptCount: 0,
      runCount: 0,
      steps: [
        { id: 'ss-4', sortOrder: 1, title: 'Listar pendências', isCritical: true },
        { id: 'ss-5', sortOrder: 2, title: 'Enviar extrato', isCritical: true },
      ],
      scripts: [],
      overlays: [],
    },
  ]

  const sopRuns = [
    {
      id: 'run-1',
      sopId: 'sop-1',
      sopName: 'Cliente não respondeu',
      status: 'InProgress',
      clientId: 'c-clara',
      clientName: 'Clara Mendes',
      progress: 33,
      wasDelayed: false,
      steps: [
        { id: 'rs-1', title: 'Checar último contato', isCritical: true, isCompleted: true },
        { id: 'rs-2', title: 'Enviar follow-up', isCritical: true, isCompleted: false },
        { id: 'rs-3', title: 'Registrar no CRM', isCritical: false, isCompleted: false },
      ],
    },
  ]

  const apps = [
    { id: 'app-notion', name: 'Notion', homeUrl: 'https://notion.so' },
    { id: 'app-gmail', name: 'Gmail', homeUrl: 'https://mail.google.com' },
  ]

  const faqs = [
    { id: 'faq-1', question: 'Qual o prazo de resposta?', answer: 'Em até 2 horas úteis no WhatsApp da operação.', sortOrder: 1, category: 'Atendimento', isPublished: true },
    { id: 'faq-2', question: 'Como envio comprovante?', answer: 'Pelo portal do contratante ou WhatsApp.', sortOrder: 2, category: 'Financeiro', isPublished: true },
  ]

  const emailAccounts = [
    {
      id: 'mail-ana',
      clientId: 'c-ana',
      clientName: 'Ana Beatriz Lima',
      emailAddress: 'ana@studiolima.com',
      displayName: 'Ana — Studio Lima',
      provider: 'demo',
      isDemo: true,
    },
  ]
  const mailbox = [
    {
      id: 'em-1',
      subject: 'Re: posts da semana',
      from: 'ana@studiolima.com',
      to: ['ju@fattovirtual.com'],
      snippet: 'Pode manter o carrossel de quinta.',
      body: 'Oi Ju,\n\nPode manter o carrossel de quinta e só ajustar a legenda.\n\nBeijos,\nAna',
      receivedAtUtc: iso(-3),
      isRead: false,
      folder: 'INBOX',
    },
    {
      id: 'em-2',
      subject: 'Contrato assinado',
      from: 'bruno@carvalho.adv.br',
      to: ['ju@fattovirtual.com'],
      snippet: 'Segue PDF assinado.',
      body: 'Ju, segue o PDF assinado em anexo.',
      receivedAtUtc: iso(-28),
      isRead: true,
      folder: 'INBOX',
    },
  ]
  const scheduledEmails: Json[] = []

  const waInbox = [
    { id: 'wa-1', from: '+5511988881001', contactName: 'Ana Beatriz', body: 'Consegue olhar minha agenda de amanhã?', receivedAtUtc: iso(-1) },
    { id: 'wa-2', from: '+5521977772002', contactName: 'Bruno Carvalho', body: 'Mandei o contrato por e-mail.', receivedAtUtc: iso(-7) },
  ]

  const notifications = [
    {
      id: 'n-1',
      title: 'Tarefa atrasada',
      body: 'Renovar contrato do Bruno passou do prazo.',
      link: '/todos',
      isRead: false,
      occursAtLocal: iso(-12),
      timeZoneId: 'America/Sao_Paulo',
      resolutionStatus: null,
      priority: 'high',
    },
    {
      id: 'n-2',
      title: 'Reunião em breve',
      body: 'Call com Ana — planejamento',
      link: '/agenda',
      isRead: false,
      occursAtLocal: iso(5),
      timeZoneId: 'America/Sao_Paulo',
      priority: 'normal',
    },
  ]

  const shareLinks = [
    {
      id: 'sl-1',
      token: 'demo-portal-ana',
      scope: 'portal',
      clientId: 'c-ana',
      clientName: 'Ana Beatriz Lima',
      createdAt: iso(-24 * 3),
      isActive: true,
      allowMessages: true,
      allowUploads: true,
      shareContactInfo: true,
      expired: false,
    },
  ]

  const accessTypes = [
    { id: 'at-owner', name: 'Owner', permissions: PERMISSIONS, isOwnerType: true, description: 'Acesso total' },
    { id: 'at-op', name: 'Operação', permissions: ['Dashboard', 'Clients.Read', 'Todos.Read', 'Todos.Write', 'Agenda.Read'], isOwnerType: false },
  ]

  const sharedUsers = [
    { id: 'u-ju', name: 'Juliana', email: 'ju@fattovirtual.com', accessTypeId: 'at-owner', accessTypeName: 'Owner', assignedClientIds: USER.assignedClientIds, isOwner: true, isCurrentUser: true },
    { id: 'u-marina', name: 'Marina Souza', email: 'marina@fattovirtual.com', accessTypeId: 'at-op', accessTypeName: 'Operação', assignedClientIds: ['c-ana'], isOwner: false },
  ]

  const chatThreads = [
    {
      id: 'th-1',
      title: 'Juliana & Marina',
      lastMessage: 'Vou fechar o caixa da Ana agora.',
      lastAt: iso(-1),
      isDirect: true,
      participants: [
        { userId: 'u-ju', name: 'Juliana' },
        { userId: 'u-marina', name: 'Marina Souza' },
      ],
    },
  ]
  const chatMessages = [
    { id: 'cm-1', threadId: 'th-1', body: 'Vou fechar o caixa da Ana agora.', authorName: 'Juliana', createdAt: iso(-1), mine: true },
    { id: 'cm-2', threadId: 'th-1', body: 'Perfeito, os comprovantes já estão no drive.', authorName: 'Marina Souza', createdAt: iso(-0.8), mine: false },
  ]

  return {
    prefs,
    org,
    groups,
    clients,
    topics,
    credentials,
    clientApps,
    invoices,
    crmEntries,
    portalMessages,
    documents,
    employees,
    employeeClients,
    columns,
    todos,
    categories,
    events,
    payments,
    partners,
    services,
    contracts,
    onboardingItems,
    templates,
    sops,
    sopRuns,
    apps,
    faqs,
    emailAccounts,
    mailbox,
    scheduledEmails,
    waInbox,
    notifications,
    shareLinks,
    accessTypes,
    sharedUsers,
    chatThreads,
    chatMessages,
    timeEntries: [
      { id: 'te-1', minutes: 90, clientId: 'c-ana', note: 'Caixa e follow-up', startedAtUtc: iso(-4), userId: 'u-ju' },
      { id: 'te-2', minutes: 45, clientId: 'c-bruno', note: 'Minuta do contrato', startedAtUtc: iso(-20), userId: 'u-ju' },
    ],
    decisions: [
      {
        id: 'dec-1',
        title: 'Ana aprovou o pacote ampliado a partir de outubro.',
        clientId: 'c-ana',
        clientName: 'Ana Beatriz Lima',
        visibleToClient: true,
        isOpen: true,
        createdAt: iso(-10),
      },
    ],
    attendancePoints: [
      { id: 'ap-1', clientId: 'c-ana', name: 'WhatsApp comercial', channel: 'WhatsApp', slaMinutes: 15 },
    ],
    userProfile: { id: USER.id, name: USER.name, email: USER.email, phone: '+55 11 99999-0000' },
  }
}

function clientName(id?: string) {
  return db.clients.find((c) => c.id === id)?.name
}

function reportRange(period?: string | null) {
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const p = period || 'week'
  if (p === 'day') return { from: today, to: new Date(today.getTime() + 86_400_000) }
  if (p === 'month') {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
    const to = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1))
    return { from, to }
  }
  const dow = today.getUTCDay()
  return {
    from: new Date(today.getTime() - dow * 86_400_000),
    to: new Date(today.getTime() + (8 - dow) * 86_400_000),
  }
}

function inRange(isoDate: string | undefined | null, from: Date, to: Date) {
  if (!isoDate) return false
  const t = new Date(isoDate).getTime()
  return t >= from.getTime() && t < to.getTime()
}

function moneySlice(list: typeof db.payments, ledger: string) {
  const s = list.filter((p) => (p.ledger || 'Agency') === ledger)
  return {
    paid: s.filter((p) => p.status === 'Paid').reduce((n, p) => n + p.amount, 0),
    pending: s.filter((p) => p.status !== 'Paid').reduce((n, p) => n + p.amount, 0),
  }
}

function buildReport(query: URLSearchParams) {
  const period = query.get('period') || 'week'
  const lens = (query.get('lens') || 'adm').toLowerCase()
  const clientId = query.get('clientId') || ''
  const { from, to } = reportRange(period)

  const scopedClients = db.clients.filter((c) => !clientId || c.id === clientId)
  const clientIds = new Set(scopedClients.map((c) => c.id))

  const todos = db.todos.filter((t) => !t.clientId || clientIds.has(t.clientId))
  const doneTodos = todos.filter((t) => t.status === 'Done' && inRange(t.updatedAt ?? t.createdAt, from, to))
  const open = todos.filter((t) => t.status !== 'Done').length
  const overdue = todos.filter((t) => t.status !== 'Done' && t.isOverdue).length

  const events = db.events.filter((e) => {
    const at = e.startsAt ?? e.startAtUtc ?? e.startAt
    if (!inRange(at, from, to)) return false
    return !e.clientId || clientIds.has(e.clientId)
  })
  const meetings = events.filter((e) => e.kind === 'Meeting' || e.categoryName === 'Reunião').length

  const decisions = db.decisions.filter((d) => {
    if (!inRange(d.createdAt, from, to)) return false
    if (d.clientId && !clientIds.has(d.clientId)) return false
    if (lens === 'client' && !d.visibleToClient) return false
    return true
  })

  const completedRuns = db.sopRuns.filter((r) => r.status === 'Done' && inRange(r.completedAtUtc, from, to)).length

  const timeEntries = db.timeEntries.filter((t) => {
    if (!inRange(t.startedAtUtc, from, to)) return false
    return !t.clientId || clientIds.has(t.clientId)
  })
  const minutes = timeEntries.reduce((n, t) => n + t.minutes, 0)
  const retainerHours = clientId
    ? (findById(db.clients, clientId)?.retainerHoursPerMonth ?? 0)
    : scopedClients.reduce((n, c) => n + (c.retainerHoursPerMonth ?? 0), 0)

  const payments = db.payments.filter((p) => {
    const at = p.paidAt ?? p.dueDate ?? p.createdAt
    if (!inRange(at, from, to)) return false
    return !p.clientId || clientIds.has(p.clientId)
  })
  const agency = moneySlice(payments, 'Agency')
  const clientAr = moneySlice(payments, 'ClientAr')
  const clientAp = moneySlice(payments, 'ClientAp')
  const payout = moneySlice(payments, 'AssistantPayout')
  const money =
    lens === 'client'
      ? { agency, clientAr, clientAp }
      : lens === 'va'
        ? { agency, payout }
        : { agency, clientAr, clientAp, payout, marginPaid: agency.paid - payout.paid }

  const byClient = scopedClients
    .map((c) => ({
      clientId: c.id,
      name: c.name,
      retainerHours: c.retainerHoursPerMonth ?? 0,
      todosDone: doneTodos.filter((t) => t.clientId === c.id).length,
      minutes: timeEntries.filter((t) => t.clientId === c.id).reduce((n, t) => n + t.minutes, 0),
    }))
    .sort((a, b) => b.todosDone - a.todosDone)
    .slice(0, 40)

  return {
    lens,
    period,
    from: from.toISOString(),
    to: to.toISOString(),
    todos: { done: doneTodos.length, open, overdue },
    agenda: { meetings, events: events.length },
    decisions: { total: decisions.length, open: decisions.filter((d) => d.isOpen).length },
    sops: { completedRuns },
    time: {
      minutes,
      hours: Math.round((minutes / 60) * 100) / 100,
      retainerHours,
      retainerUsedHours: Math.round((minutes / 60) * 100) / 100,
    },
    money,
    byClient,
    evidence: {
      todos: doneTodos.slice(0, 12).map((t) => ({ id: t.id, title: t.title, clientName: t.clientName })),
      decisions: decisions.slice(0, 12).map((d) => ({
        id: d.id,
        title: d.title,
        isOpen: d.isOpen,
        visibleToClient: d.visibleToClient,
        clientName: d.clientName,
      })),
    },
  }
}

function columnName(id?: string) {
  return db.columns.find((c) => c.id === id)?.name
}

function mapOnboarding(clientId: string) {
  return db.onboardingItems.filter((i) => i.clientId === clientId)
}

function clientDetail(id: string) {
  const client = requireRow(db.clients, id)
  const todos = db.todos.filter((t) => t.clientId === id)
  const payments = db.payments.filter((p) => p.clientId === id)
  const contracts = db.contracts.filter((c) => c.clientId === id)
  const invoices = db.invoices.filter((i) => i.clientId === id)
  const apps = db.clientApps.filter((a) => a.clientId === id)
  const credentials = db.credentials.filter((c) => c.clientId === id)
  const pending = payments.filter((p) => p.status !== 'Paid')
  const paid = payments.filter((p) => p.status === 'Paid')
  return {
    ...client,
    topics: db.topics.filter((t) => t.clientId === id),
    links: [],
    credentials,
    apps,
    invoices,
    payments,
    crmEntries: db.crmEntries.filter((e) => e.clientId === id),
    contracts,
    todos,
    openTodos: todos.filter((t) => t.status !== 'Done').map((t) => ({ id: t.id, title: t.title, status: t.status })),
    agenda: db.events.filter((e) => e.clientId === id).map((e) => ({ id: e.id, title: e.title, startAt: e.startAt, endAt: e.endAt })),
    responsibles: db.employeeClients
      .filter((x) => x.clientId === id)
      .map((x) => db.employees.find((e) => e.id === x.employeeId))
      .filter(Boolean)
      .map((e) => ({ id: e!.id, name: e!.name, color: e!.color, email: e!.email })),
    onboarding: mapOnboarding(id),
    summary: {
      since: client.createdAt,
      paidTotal: paid.reduce((s, p) => s + p.amount, 0),
      pendingTotal: pending.reduce((s, p) => s + p.amount, 0),
      agencyPaid: 0,
      agencyPending: 0,
      clientArPaid: paid.reduce((s, p) => s + p.amount, 0),
      clientArPending: pending.reduce((s, p) => s + p.amount, 0),
      clientApPaid: 0,
      clientApPending: 0,
      openTodos: todos.filter((t) => t.status !== 'Done').length,
      invoices: invoices.length,
      apps: apps.length,
      credentials: credentials.length,
      contracts: contracts.length,
    },
  }
}

function refreshGroupCounts() {
  for (const group of db.groups) {
    group.clientCount = db.clients.filter((c) => c.clientGroupId === group.id).length
  }
}

function operationsQueue() {
  const queue = [
    ...db.notifications.filter((n) => !n.isRead).map((n) => ({
      id: n.id,
      kind: 'alert',
      title: n.title,
      body: n.body,
      link: n.link ?? '/notificacoes',
      dueAtUtc: n.occursAtLocal,
      priority: n.priority,
    })),
    ...db.todos
      .filter((t) => t.status !== 'Done')
      .map((t) => ({
        id: t.id,
        kind: t.isOverdue ? 'todo_overdue' : 'todo',
        title: t.title,
        body: t.description,
        link: '/todos',
        clientId: t.clientId,
        clientName: t.clientName,
        dueAtUtc: t.dueAtUtc,
        priority: t.priority,
      })),
    ...db.events.map((e) => ({
      id: e.id,
      kind: 'agenda',
      title: e.title,
      link: '/agenda',
      clientId: e.clientId,
      clientName: e.clientName,
      dueAtUtc: e.startAtUtc,
    })),
    ...db.clients
      .filter((c) => c.needsQuickResponse)
      .map((c) => ({
        id: `qr-${c.id}`,
        kind: 'quick_response',
        title: `Atendimento rápido — ${c.name}`,
        link: `/clientes/${c.id}`,
        clientId: c.id,
        clientName: c.name,
        priority: 'high',
      })),
  ]
  return {
    organization: { name: db.org.name, kind: db.org.kind, defaultTimeZoneId: db.org.defaultTimeZoneId },
    effectiveTimeZoneId: db.prefs.effectiveTimeZoneId,
    summary: {
      alerts: db.notifications.filter((n) => !n.isRead).length,
      todos: db.todos.filter((t) => t.status !== 'Done').length,
      agenda: db.events.length,
      clientsAttention: db.clients.filter((c) => c.status !== 'Active').length,
      total: queue.length,
    },
    byGroup: db.groups.map((g) => ({ id: g.id, name: g.name, color: g.color, count: g.clientCount })),
    queue,
  }
}

function publicPortal(token: string) {
  const link = db.shareLinks.find((s) => s.token === token && s.isActive !== false)
  if (!link) {
    const err = new Error('not-found') as Error & { status: number; payload: unknown }
    err.status = 404
    err.payload = { detail: 'Link inválido ou expirado' }
    throw err
  }
  const client = db.clients.find((c) => c.id === link.clientId)
  const pays = db.payments.filter((p) => p.clientId === link.clientId)
  return {
    scope: link.scope,
    brand: db.org.name,
    client: client
      ? {
          name: client.name,
          companyName: client.companyName,
          phone: client.phone,
          email: client.email,
          status: client.status,
          nextAction: client.nextAction,
          nextActionAtUtc: client.nextActionAtUtc,
          relationshipStage: client.relationshipStage,
        }
      : undefined,
    finance: {
      pendingTotal: pays.filter((p) => p.status !== 'Paid').reduce((s, p) => s + p.amount, 0),
      paidTotal: pays.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0),
      items: pays.map((p) => ({
        description: p.description,
        amount: p.amount,
        status: p.status,
        dueDate: p.dueDate,
        paidAt: p.paidAt,
      })),
    },
    contracts: db.contracts.filter((c) => c.clientId === link.clientId).map((c) => ({ name: c.name, status: c.status, hasPdf: false })),
    agenda: db.events.filter((e) => e.clientId === link.clientId).map((e) => ({ title: e.title, startAt: e.startAt, endAt: e.endAt })),
    documents: db.documents.filter((d) => d.clientId === link.clientId),
    messages: db.portalMessages.filter((m) => m.clientId === link.clientId),
    faqs: db.faqs.filter((f) => f.isPublished).map((f) => ({ question: f.question, answer: f.answer })),
    capabilities: { canMessage: true, canUpload: true, canViewFinance: true, canViewContracts: true, canViewAgenda: true },
  }
}

const routes: Route[] = [
  { method: 'POST', pattern: '/auth/login', handle: () => ({ ...TOKENS, expiresAt: iso(24), user: USER }) },
  { method: 'POST', pattern: '/auth/refresh', handle: () => ({ ...TOKENS, expiresAt: iso(24) }) },
  { method: 'POST', pattern: '/auth/logout', handle: () => undefined },
  { method: 'GET', pattern: '/auth/me', handle: () => USER },
  { method: 'POST', pattern: '/auth/verify-admin-password', handle: () => ({ ok: true }) },

  { method: 'GET', pattern: '/preferences/me', handle: () => db.prefs },
  {
    method: 'PUT',
    pattern: '/preferences/me',
    handle: ({ body }) => {
      Object.assign(db.prefs, body)
      return db.prefs
    },
  },
  {
    method: 'PUT',
    pattern: '/preferences/me/travel',
    handle: ({ body }) => {
      if (typeof body.detectedTimeZoneId === 'string') db.prefs.detectedTimeZoneId = body.detectedTimeZoneId
      if (typeof body.travelModeEnabled === 'boolean') db.prefs.travelModeEnabled = body.travelModeEnabled
      if (body.travelTimeZoneId !== undefined) db.prefs.travelTimeZoneId = body.travelTimeZoneId as string
      if (body.travelLabel !== undefined) db.prefs.travelLabel = body.travelLabel as string
      db.prefs.isAwayFromHome = Boolean(db.prefs.travelModeEnabled)
      db.prefs.effectiveTimeZoneId = db.prefs.travelModeEnabled
        ? db.prefs.travelTimeZoneId || db.prefs.detectedTimeZoneId || db.prefs.timeZoneId
        : db.prefs.timeZoneId
      return db.prefs
    },
  },
  {
    method: 'GET',
    pattern: '/timezones',
    handle: () =>
      ['America/Sao_Paulo', 'America/Manaus', 'America/Fortaleza', 'America/New_York', 'Europe/Lisbon'].map((id) => ({
        id,
        label: id,
      })),
  },
  { method: 'GET', pattern: '/notifications', handle: () => db.notifications },
  {
    method: 'POST',
    pattern: '/notifications/read-all',
    handle: () => {
      db.notifications.forEach((n) => {
        n.isRead = true
      })
    },
  },
  {
    method: 'POST',
    pattern: '/notifications/:id/read',
    handle: ({ params }) => {
      const n = findById(db.notifications, params.id)
      if (n) n.isRead = true
    },
  },
  {
    method: 'POST',
    pattern: '/notifications/:id/resolve',
    handle: ({ params, body }) => {
      const n = findById(db.notifications, params.id)
      if (n) n.resolutionStatus = String(body.status ?? 'resolved')
    },
  },

  {
    method: 'GET',
    pattern: '/dashboard/stats',
    handle: () => ({
      isOwner: true,
      clients: db.clients.length,
      activeClients: db.clients.filter((c) => c.status === 'Active').length,
      paymentsPending: db.payments.filter((p) => p.status !== 'Paid').length,
      employees: db.employees.length,
      partners: db.partners.length,
      services: db.services.length,
      contracts: db.contracts.length,
      onboardingPending: db.clients.filter((c) => !c.onboardingCompleted).length,
      agendaToday: db.events.length,
      myClients: db.clients.length,
      myTodos: db.todos.filter((t) => t.status !== 'Done').length,
      myAgenda: db.events.length,
      requests: 0,
      sops: db.sops.length,
    }),
  },
  { method: 'GET', pattern: '/reports', handle: ({ query }) => buildReport(query) },
  {
    method: 'GET',
    pattern: '/time-entries',
    handle: ({ query }) => {
      const clientId = query.get('clientId')
      return db.timeEntries.filter((t) => !clientId || t.clientId === clientId)
    },
  },
  {
    method: 'POST',
    pattern: '/time-entries',
    handle: ({ body }) => {
      const minutes = Number(body.minutes ?? 0)
      const row = {
        id: nid('te'),
        minutes,
        clientId: body.clientId ? String(body.clientId) : undefined,
        note: body.note ? String(body.note) : undefined,
        startedAtUtc: iso(),
        userId: USER.id,
      }
      db.timeEntries.push(row as (typeof db.timeEntries)[0])
      return { ...row, clientName: clientName(row.clientId) }
    },
  },
  { method: 'GET', pattern: '/decisions', handle: ({ query }) => {
    const clientId = query.get('clientId')
    return db.decisions.filter((d) => !clientId || d.clientId === clientId)
  } },
  {
    method: 'POST',
    pattern: '/decisions',
    handle: ({ body }) => {
      const clientId = body.clientId ? String(body.clientId) : undefined
      const row = {
        id: nid('dec'),
        title: String(body.title ?? 'Decisão'),
        clientId,
        clientName: clientName(clientId),
        visibleToClient: Boolean(body.visibleToClient),
        isOpen: true,
        createdAt: iso(),
      }
      db.decisions.push(row as (typeof db.decisions)[0])
      if (body.createTodo) {
        db.todos.push({
          id: nid('todo'),
          title: row.title,
          status: 'Todo',
          boardColumnId: 'col-todo',
          boardColumnName: 'A fazer',
          priority: 'Normal',
          ownerUserId: USER.id,
          ownerUserName: USER.name,
          clientId,
          clientName: row.clientName,
          isGeneral: !clientId,
          comments: [],
        } as (typeof db.todos)[0])
      }
      return row
    },
  },
  {
    method: 'GET',
    pattern: '/attendance-points',
    handle: ({ query }) => {
      const clientId = query.get('clientId')
      return db.attendancePoints.filter((p) => !clientId || p.clientId === clientId)
    },
  },
  {
    method: 'POST',
    pattern: '/attendance-points',
    handle: ({ body }) => {
      const clientId = String(body.clientId ?? '')
      const row = {
        id: nid('ap'),
        clientId,
        clientName: clientName(clientId),
        name: String(body.name ?? 'Ponto'),
        channel: String(body.channel ?? 'WhatsApp'),
        slaMinutes: body.slaMinutes ? Number(body.slaMinutes) : 15,
        isActive: true,
      }
      db.attendancePoints.push(row as (typeof db.attendancePoints)[0])
      return row
    },
  },
  { method: 'GET', pattern: '/operations/queue', handle: () => operationsQueue() },

  { method: 'GET', pattern: '/client-groups', handle: () => db.groups },
  {
    method: 'POST',
    pattern: '/client-groups',
    handle: ({ body }) => {
      const row = { id: nid('g'), name: String(body.name ?? 'Grupo'), description: '', color: '#0F4C5C', sortOrder: db.groups.length + 1, clientCount: 0 }
      db.groups.push(row)
      return row
    },
  },

  {
    method: 'GET',
    pattern: '/clients/counts',
    handle: () => ({
      total: db.clients.length,
      active: db.clients.filter((c) => c.status === 'Active').length,
      inactive: db.clients.filter((c) => c.status === 'Inactive').length,
      notice: db.clients.filter((c) => c.status === 'Notice').length,
      hold: db.clients.filter((c) => c.status === 'Hold').length,
    }),
  },
  { method: 'GET', pattern: '/clients', handle: () => db.clients },
  {
    method: 'POST',
    pattern: '/clients',
    handle: ({ body }) => {
      const row = {
        id: nid('c'),
        name: String(body.name ?? 'Novo cliente'),
        status: String(body.status ?? 'Active'),
        phone: body.phone,
        email: body.email,
        companyName: body.companyName,
        createdAt: iso(),
        onboardingCompleted: false,
      }
      db.clients.push(row as (typeof db.clients)[0])
      return row
    },
  },
  { method: 'GET', pattern: '/clients/:id/pending-todos', handle: ({ params }) => ({ hasPending: db.todos.some((t) => t.clientId === params.id && t.status !== 'Done') }) },
  { method: 'GET', pattern: '/clients/:id/partners', handle: ({ params }) => db.partners.filter((p) => p.clients?.some((c) => c.clientId === params.id)).map((p) => ({ id: `${p.id}-${params.id}`, partnerId: p.id, name: p.name, responsibleName: p.responsibleName, contact: p.contact, service: p.service, status: 'Active', notes: p.notes })) },
  { method: 'POST', pattern: '/clients/:id/partners', handle: ({ params, body }) => {
    const partner = findById(db.partners, String(body.partnerId))
    if (partner) partner.clients = [...(partner.clients ?? []), { clientId: params.id, clientName: clientName(params.id), status: String(body.status ?? 'Active'), notes: '' }]
    return { ok: true }
  } },
  { method: 'GET', pattern: '/clients/:id/portal-messages', handle: ({ params }) => db.portalMessages.filter((m) => m.clientId === params.id) },
  { method: 'POST', pattern: '/clients/:id/portal-messages', handle: ({ params, body }) => {
    const row = { id: nid('pm'), clientId: params.id, body: String(body.body ?? ''), fromContractor: false, authorLabel: 'Juliana', createdAt: iso() }
    db.portalMessages.push(row)
    return row
  } },
  { method: 'GET', pattern: '/clients/:id/documents', handle: ({ params }) => db.documents.filter((d) => d.clientId === params.id) },
  { method: 'POST', pattern: '/clients/:id/topics', handle: ({ params, body }) => {
    const row = { id: nid('t'), clientId: params.id, title: String(body.title ?? 'Tópico'), content: String(body.content ?? '') }
    db.topics.push(row)
    return row
  } },
  { method: 'DELETE', pattern: '/clients/:id/topics/:topicId', handle: ({ params }) => { db.topics.splice(db.topics.findIndex((t) => t.id === params.topicId), 1) } },
  { method: 'POST', pattern: '/clients/:id/credentials', handle: ({ params, body }) => {
    const row = { id: nid('cred'), clientId: params.id, appName: String(body.appName ?? ''), login: String(body.login ?? ''), password: String(body.password ?? '') }
    db.credentials.push(row)
    return row
  } },
  { method: 'DELETE', pattern: '/clients/:id/credentials/:credentialId', handle: ({ params }) => { const i = db.credentials.findIndex((c) => c.id === params.credentialId); if (i >= 0) db.credentials.splice(i, 1) } },
  { method: 'POST', pattern: '/clients/:id/apps', handle: ({ params, body }) => {
    const row = { id: nid('capp'), clientId: params.id, name: String(body.name ?? 'App'), appId: body.appId as string | undefined }
    db.clientApps.push(row)
    return row
  } },
  { method: 'DELETE', pattern: '/clients/:id/apps/:appId', handle: ({ params }) => { const i = db.clientApps.findIndex((a) => a.id === params.appId); if (i >= 0) db.clientApps.splice(i, 1) } },
  { method: 'POST', pattern: '/clients/:id/invoices', handle: ({ params, body }) => {
    const row = { id: nid('inv'), clientId: params.id, reference: String(body.reference ?? ''), amount: Number(body.amount ?? 0), periodStart: String(body.periodStart ?? ''), periodEnd: String(body.periodEnd ?? ''), status: String(body.status ?? 'Pending'), kind: body.kind as string | undefined, dueDate: body.dueDate as string | undefined, notes: body.notes as string | undefined }
    db.invoices.push(row)
    return row
  } },
  { method: 'POST', pattern: '/clients/:id/crm-entries', handle: ({ params, body }) => {
    const row = { id: nid('crm'), clientId: params.id, kind: String(body.kind ?? 'Note'), summary: String(body.summary ?? ''), channel: body.channel as string | undefined, createdByName: 'Juliana', createdAt: iso() }
    db.crmEntries.push(row)
    return row
  } },
  { method: 'POST', pattern: '/clients/:id/status', handle: ({ params, body }) => {
    const client = requireRow(db.clients, params.id)
    client.status = String(body.status ?? client.status)
    return client
  } },
  { method: 'PATCH', pattern: '/clients/:id/notes', handle: ({ params, body }) => {
    const client = requireRow(db.clients, params.id)
    Object.assign(client, body)
    return client
  } },
  { method: 'PATCH', pattern: '/clients/:id/retainer', handle: ({ params, body }) => {
    const client = requireRow(db.clients, params.id)
    client.retainerHoursPerMonth = Math.max(0, Number(body.hoursPerMonth ?? 0))
    return { id: client.id, retainerHoursPerMonth: client.retainerHoursPerMonth }
  } },
  { method: 'GET', pattern: '/clients/:id', handle: ({ params }) => clientDetail(params.id) },
  { method: 'PUT', pattern: '/clients/:id', handle: ({ params, body }) => {
    const client = requireRow(db.clients, params.id)
    Object.assign(client, body)
    const group = db.groups.find((g) => g.id === client.clientGroupId)
    if (group) {
      client.clientGroupName = group.name
      client.clientGroupColor = group.color
    }
    refreshGroupCounts()
    return client
  } },
  { method: 'DELETE', pattern: '/clients/:id', handle: ({ params }) => {
    const i = db.clients.findIndex((c) => c.id === params.id)
    if (i >= 0) db.clients.splice(i, 1)
    refreshGroupCounts()
  } },

  { method: 'GET', pattern: '/employees', handle: () => db.employees },
  { method: 'POST', pattern: '/employees', handle: ({ body }) => {
    const row = { id: nid('e'), name: String(body.name ?? 'Prestador'), phone: body.phone as string | undefined, email: body.email as string | undefined, color: String(body.color ?? '#0F4C5C'), status: 'Active', managerId: (body.managerId as string | null) ?? null }
    db.employees.push(row)
    return row
  } },
  { method: 'GET', pattern: '/employees/:id/summary', handle: ({ params }) => {
    const emp = requireRow(db.employees, params.id)
    const assigned = db.employeeClients.filter((x) => x.employeeId === params.id).map((x) => db.clients.find((c) => c.id === x.clientId)).filter(Boolean)
    return {
      ...emp,
      contractNotes: '',
      contracts: db.contracts.filter((c) => c.employeeId === params.id),
      payments: db.payments.filter((p) => p.employeeId === params.id),
      assignedClients: assigned,
      todos: db.todos.filter((t) => assigned.some((c) => c && c.id === t.clientId)),
      workDays: [],
    }
  } },
  { method: 'POST', pattern: '/employees/:id/clients/:clientId', handle: ({ params }) => {
    if (!db.employeeClients.some((x) => x.employeeId === params.id && x.clientId === params.clientId)) {
      db.employeeClients.push({ employeeId: params.id, clientId: params.clientId })
    }
    return { ok: true }
  } },
  { method: 'DELETE', pattern: '/employees/:id/clients/:clientId', handle: ({ params }) => {
    const i = db.employeeClients.findIndex((x) => x.employeeId === params.id && x.clientId === params.clientId)
    if (i >= 0) db.employeeClients.splice(i, 1)
  } },
  {
    method: 'GET',
    pattern: '/pyramid',
    handle: () => ({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Juliana',
      color: '#0F4C5C',
      children: db.employees
        .filter((e) => !e.managerId)
        .map((e) => ({
          id: e.id,
          name: e.name,
          color: e.color,
          children: db.employees.filter((c) => c.managerId === e.id).map((c) => ({ id: c.id, name: c.name, color: c.color, children: [] })),
        })),
    }),
  },

  { method: 'GET', pattern: '/payments/mine', handle: () => db.payments },
  { method: 'GET', pattern: '/payments', handle: () => db.payments },
  { method: 'POST', pattern: '/payments', handle: ({ body }) => {
    const row = {
      id: nid('pay'),
      amount: Number(body.amount ?? 0),
      description: String(body.description ?? ''),
      paidAt: null,
      dueDate: body.dueDate as string | null,
      ledger: (body.ledger as string) ?? 'ClientAr',
      counterpartyName: body.counterpartyName as string | undefined,
      category: body.category as string | undefined,
      clientId: body.clientId as string | undefined,
      clientName: clientName(body.clientId as string | undefined),
      employeeId: body.employeeId as string | undefined,
      status: 'Pending',
      links: (body.links as unknown[]) ?? [],
    }
    db.payments.push(row as (typeof db.payments)[0])
    return row
  } },
  { method: 'POST', pattern: '/payments/:id/settle', handle: ({ params, body }) => {
    const pay = requireRow(db.payments, params.id)
    pay.status = 'Paid'
    pay.paidAt = iso()
    pay.settleMethod = String(body.method ?? body.settleMethod ?? 'Pix')
    pay.hasProof = true
    return pay
  } },
  {
    method: 'GET',
    pattern: '/finance/active-client-tasks',
    handle: () =>
      db.clients
        .filter((c) => c.status === 'Active')
        .map((c) => ({
          clientId: c.id,
          clientName: c.name,
          hasPaymentThisMonth: db.payments.some((p) => p.clientId === c.id),
        })),
  },

  { method: 'GET', pattern: '/partners', handle: () => db.partners },
  { method: 'POST', pattern: '/partners', handle: ({ body }) => {
    const row = { id: nid('pt'), name: String(body.name ?? 'Parceira'), responsibleName: body.responsibleName as string | undefined, contact: body.contact as string | undefined, service: body.service as string | undefined, notes: body.notes as string | undefined, clients: [] as { clientId: string; clientName?: string; status: string; notes?: string }[] }
    db.partners.push(row)
    return row
  } },
  { method: 'PUT', pattern: '/partners/:id', handle: ({ params, body }) => {
    const row = requireRow(db.partners, params.id)
    Object.assign(row, body)
    return row
  } },
  { method: 'POST', pattern: '/partners/:id/assign-client', handle: ({ params, body }) => {
    const partner = requireRow(db.partners, params.id)
    partner.clients = partner.clients ?? []
    partner.clients.push({ clientId: String(body.clientId), clientName: clientName(String(body.clientId)), status: String(body.status ?? 'Active'), notes: String(body.notes ?? '') })
    return partner
  } },
  { method: 'DELETE', pattern: '/partners/:id/clients/:clientId', handle: ({ params }) => {
    const partner = findById(db.partners, params.id)
    if (partner?.clients) partner.clients = partner.clients.filter((c) => c.clientId !== params.clientId)
  } },

  { method: 'GET', pattern: '/services', handle: () => db.services },
  { method: 'POST', pattern: '/services', handle: ({ body }) => {
    const row = { id: nid('svc'), title: String(body.title ?? 'Serviço'), description: body.description as string | undefined, category: body.category as string | undefined, isActive: true, clients: [] as { clientId: string; clientName?: string; status: string; customNotes?: string }[] }
    db.services.push(row)
    return row
  } },
  { method: 'POST', pattern: '/services/:id/assign-client', handle: ({ params, body }) => {
    const svc = requireRow(db.services, params.id)
    svc.clients = svc.clients ?? []
    svc.clients.push({ clientId: String(body.clientId), clientName: clientName(String(body.clientId)), status: 'Active', customNotes: String(body.customNotes ?? '') })
    return svc
  } },

  { method: 'GET', pattern: '/contracts', handle: () => db.contracts },
  { method: 'POST', pattern: '/contracts', handle: ({ body }) => {
    const row = {
      id: nid('ct'),
      name: String(body.name ?? 'Contrato'),
      type: (body.type as string) ?? 'Client',
      status: String(body.status ?? 'Active'),
      clientId: body.clientId as string | undefined,
      employeeId: body.employeeId as string | undefined,
      partyName: clientName(body.clientId as string | undefined) || db.employees.find((e) => e.id === body.employeeId)?.name,
    }
    db.contracts.push(row as (typeof db.contracts)[0])
    return row
  } },
  { method: 'PUT', pattern: '/contracts/:id', handle: ({ params, body }) => {
    const row = requireRow(db.contracts, params.id)
    Object.assign(row, body)
    return row
  } },
  { method: 'POST', pattern: '/contracts/:id/pdf', handle: ({ params }) => {
    const row = requireRow(db.contracts, params.id)
    row.pdfUrl = `/api/v1/contracts/${row.id}/pdf`
    return row
  } },

  {
    method: 'GET',
    pattern: '/onboarding/incomplete',
    handle: () =>
      db.clients
        .filter((c) => !c.onboardingCompleted)
        .map((c) => {
          const items = mapOnboarding(c.id)
          return { id: `obc-${c.id}`, clientId: c.id, clientName: c.name, completedCount: items.filter((i) => i.isCompleted).length, totalCount: items.length, items }
        }),
  },
  { method: 'GET', pattern: '/checklist-templates', handle: () => db.templates },
  { method: 'POST', pattern: '/checklist-templates', handle: ({ body }) => {
    const row = { id: nid('tpl'), name: String(body.name ?? 'Template'), items: Array.isArray(body.items) ? body.items.map(String) : String(body.items ?? '').split('\n').filter(Boolean) }
    db.templates.push(row)
    return row
  } },
  { method: 'PATCH', pattern: '/onboarding/:clientId/items/:itemId', handle: ({ params, body }) => {
    const item = db.onboardingItems.find((i) => i.id === params.itemId && i.clientId === params.clientId)
    if (item) item.isCompleted = Boolean(body.isCompleted)
    const items = mapOnboarding(params.clientId)
    const client = findById(db.clients, params.clientId)
    if (client && items.length > 0 && items.every((i) => i.isCompleted)) client.onboardingCompleted = true
    return item
  } },
  { method: 'POST', pattern: '/onboarding/:clientId/apply-template', handle: ({ params, body }) => {
    const tpl = findById(db.templates, String(body.templateId))
    if (!tpl) return []
    const created = tpl.items.map((title, i) => ({ id: nid('ob'), clientId: params.clientId, title, isCompleted: false, sortOrder: i + 1 }))
    db.onboardingItems.push(...created)
    const client = findById(db.clients, params.clientId)
    if (client) client.onboardingCompleted = false
    return created
  } },

  { method: 'GET', pattern: '/agenda/categories', handle: () => db.categories },
  { method: 'POST', pattern: '/agenda/categories', handle: ({ body }) => {
    const row = { id: nid('cat'), name: String(body.name ?? 'Categoria'), color: String(body.color ?? '#0F4C5C') }
    db.categories.push(row)
    return row
  } },
  { method: 'DELETE', pattern: '/agenda/categories/:id', handle: ({ params }) => {
    const i = db.categories.findIndex((c) => c.id === params.id)
    if (i >= 0) db.categories.splice(i, 1)
  } },
  { method: 'GET', pattern: '/agenda/events', handle: () => db.events },
  { method: 'POST', pattern: '/agenda/events', handle: ({ body }) => {
    const cat = findById(db.categories, String(body.categoryId ?? ''))
    const row = {
      id: nid('ev'),
      title: String(body.title ?? 'Evento'),
      startAt: String(body.startAt ?? iso()),
      endAt: body.endAt as string | undefined,
      startAtUtc: String(body.startAt ?? iso()),
      timeZoneId: String(body.timeZoneId ?? 'America/Sao_Paulo'),
      displayTimeZoneId: String(body.timeZoneId ?? 'America/Sao_Paulo'),
      remindMinutesBefore: Number(body.remindMinutesBefore ?? 30),
      categoryId: cat?.id,
      categoryName: cat?.name,
      categoryColor: cat?.color,
      responsibleUserId: USER.id,
      responsibleUserName: USER.name,
      clientId: body.clientId as string | undefined,
      clientName: clientName(body.clientId as string | undefined),
      description: body.description as string | undefined,
      linkedTodos: [],
    }
    db.events.push(row as (typeof db.events)[0])
    return row
  } },
  { method: 'POST', pattern: '/agenda/events/:id/todos', handle: ({ params }) => {
    const event = requireRow(db.events, params.id)
    const todo = {
      id: nid('todo'),
      title: event.title,
      status: 'Todo',
      boardColumnId: 'col-todo',
      boardColumnName: 'A fazer',
      ownerUserId: USER.id,
      ownerUserName: USER.name,
      clientId: event.clientId,
      clientName: event.clientName,
      isGeneral: !event.clientId,
      agendaEventId: event.id,
      agendaEventTitle: event.title,
      comments: [],
    }
    db.todos.push(todo as (typeof db.todos)[0])
    event.linkedTodos = [...(event.linkedTodos ?? []), { id: todo.id, title: todo.title, status: todo.status }]
    return todo
  } },

  { method: 'GET', pattern: '/sops/hub', handle: () => ({
    continueRuns: db.sopRuns.filter((r) => r.status === 'InProgress').map((r) => ({ id: r.id, sopId: r.sopId, sopName: r.sopName, clientName: r.clientName, progress: r.progress })),
    frequent: db.sops.map((s) => ({ sopId: s.id, name: s.name, procedureType: s.procedureType, category: s.category, runs: s.runCount ?? 0 })),
    areas: [...new Set(db.sops.map((s) => s.category).filter(Boolean))].map((area) => ({ area, count: db.sops.filter((s) => s.category === area).length })),
    situations: db.sops.flatMap((s) => (s.situationAliases ?? []).map((label) => ({ sopId: s.id, label, sopName: s.name }))),
  }) },
  { method: 'GET', pattern: '/sops/metrics', handle: () => ({
    periodDays: 30,
    activeSops: db.sops.length,
    totalRuns: db.sopRuns.length,
    completedRuns: db.sopRuns.filter((r) => r.status === 'Done').length,
    delayedRuns: db.sopRuns.filter((r) => r.wasDelayed).length,
    inProgress: db.sopRuns.filter((r) => r.status === 'InProgress').length,
    top: db.sops.map((s) => ({ sopId: s.id, name: s.name, used: s.runCount ?? 0, delayed: 0, completionRate: 50 })),
  }) },
  { method: 'GET', pattern: '/sops/runs/mine', handle: () => db.sopRuns },
  { method: 'GET', pattern: '/sops/runs/:id', handle: ({ params }) => requireRow(db.sopRuns, params.id) },
  { method: 'PATCH', pattern: '/sops/runs/:id/steps/:stepId', handle: ({ params, body }) => {
    const run = requireRow(db.sopRuns, params.id)
    const step = run.steps.find((s) => s.id === params.stepId)
    if (step) step.isCompleted = Boolean(body.isCompleted)
    const done = run.steps.filter((s) => s.isCompleted).length
    run.progress = Math.round((done / Math.max(run.steps.length, 1)) * 100)
    return run
  } },
  { method: 'POST', pattern: '/sops/runs/:id/complete', handle: ({ params }) => {
    const run = requireRow(db.sopRuns, params.id)
    run.status = 'Done'
    run.progress = 100
    run.steps.forEach((s) => { s.isCompleted = true })
    return run
  } },
  { method: 'PATCH', pattern: '/sops/runs/:id', handle: ({ params, body }) => {
    const run = requireRow(db.sopRuns, params.id)
    Object.assign(run, body)
    return run
  } },
  { method: 'GET', pattern: '/sops', handle: ({ query }) => {
    const q = (query.get('q') ?? '').toLowerCase()
    const category = query.get('category') ?? ''
    return db.sops.filter((s) => {
      const text = `${s.name} ${s.usageDescription ?? ''} ${(s.situationAliases ?? []).join(' ')}`.toLowerCase()
      if (q && !text.includes(q)) return false
      if (category && s.category !== category) return false
      return true
    })
  } },
  { method: 'POST', pattern: '/sops', handle: ({ body }) => {
    const row = { id: nid('sop'), name: String(body.name ?? 'SOP'), scripts: [], steps: Array.isArray(body.steps) ? body.steps : [], overlays: [], runCount: 0, ...body }
    db.sops.push(row as (typeof db.sops)[0])
    return row
  } },
  { method: 'GET', pattern: '/sops/:id', handle: ({ params }) => requireRow(db.sops, params.id) },
  { method: 'PUT', pattern: '/sops/:id', handle: ({ params, body }) => {
    const row = requireRow(db.sops, params.id)
    Object.assign(row, body)
    return row
  } },
  { method: 'POST', pattern: '/sops/:id/scripts', handle: ({ params, body }) => {
    const sop = requireRow(db.sops, params.id)
    const row = { id: nid('sc'), type: String(body.type ?? 'whatsapp'), content: String(body.content ?? ''), title: body.title as string | undefined }
    sop.scripts.push(row)
    sop.scriptCount = sop.scripts.length
    return row
  } },
  { method: 'POST', pattern: '/sops/:id/overlays', handle: ({ params, body }) => {
    const sop = requireRow(db.sops, params.id)
    const row = { id: nid('ov'), kind: String(body.kind ?? 'note'), title: String(body.title ?? ''), body: String(body.body ?? ''), clientId: body.clientId as string | undefined, clientName: clientName(body.clientId as string | undefined), serviceItemId: body.serviceItemId as string | undefined }
    sop.overlays = sop.overlays ?? []
    sop.overlays.push(row)
    return row
  } },
  { method: 'POST', pattern: '/sops/:id/runs', handle: ({ params, body }) => {
    const sop = requireRow(db.sops, params.id)
    const run = {
      id: nid('run'),
      sopId: sop.id,
      sopName: sop.name,
      status: 'InProgress',
      clientId: (body.clientId as string | undefined) || undefined,
      clientName: clientName(body.clientId as string | undefined),
      progress: 0,
      steps: (sop.steps ?? []).map((s, i) => ({ id: nid('rs'), title: s.title, instruction: s.instruction, isCritical: Boolean(s.isCritical), isCompleted: false, estimatedMinutes: s.estimatedMinutes, actionKind: s.actionKind, actionPath: s.actionPath, actionLabel: s.actionLabel, sortOrder: i })),
    }
    db.sopRuns.push(run as (typeof db.sopRuns)[0])
    sop.runCount = (sop.runCount ?? 0) + 1
    return run
  } },

  { method: 'GET', pattern: '/apps', handle: () => db.apps },
  { method: 'POST', pattern: '/apps', handle: ({ body }) => {
    const row = { id: nid('app'), name: String(body.name ?? 'App'), homeUrl: body.homeUrl as string | undefined, downloadUrl: body.downloadUrl as string | undefined }
    db.apps.push(row)
    return row
  } },

  { method: 'GET', pattern: '/todo-board/columns', handle: () => db.columns.map((c) => ({ ...c, count: db.todos.filter((t) => t.boardColumnId === c.id).length })) },
  { method: 'POST', pattern: '/todo-board/columns', handle: ({ body }) => {
    const row = { id: nid('col'), name: String(body.name ?? 'Coluna'), color: '#94A3B8', sortOrder: db.columns.length + 1, marksComplete: false }
    db.columns.push(row)
    return row
  } },
  { method: 'PUT', pattern: '/todo-board/columns/:id', handle: ({ params, body }) => {
    const col = requireRow(db.columns, params.id)
    if (body.name) col.name = String(body.name)
    return col
  } },
  { method: 'DELETE', pattern: '/todo-board/columns/:id', handle: ({ params }) => {
    const i = db.columns.findIndex((c) => c.id === params.id)
    if (i >= 0) db.columns.splice(i, 1)
  } },
  { method: 'GET', pattern: '/todos', handle: ({ query }) => {
    const ownerId = query.get('ownerId')
    return ownerId ? db.todos.filter((t) => t.ownerUserId === ownerId) : db.todos
  } },
  { method: 'POST', pattern: '/todos', handle: ({ body }) => {
    const colId = String(body.boardColumnId || 'col-todo')
    const row = {
      id: nid('todo'),
      title: String(body.title ?? 'Tarefa'),
      description: body.description as string | undefined,
      status: 'Todo',
      boardColumnId: colId,
      boardColumnName: columnName(colId),
      priority: String(body.priority ?? 'Normal'),
      tags: typeof body.tags === 'string' ? String(body.tags).split(',').map((t) => t.trim()).filter(Boolean) : (body.tags as string[] | undefined) ?? [],
      ownerUserId: USER.id,
      ownerUserName: USER.name,
      clientId: body.clientId as string | undefined,
      clientName: clientName(body.clientId as string | undefined),
      isGeneral: Boolean(body.isGeneral ?? !body.clientId),
      dueAtUtc: body.dueAt ? new Date(String(body.dueAt)).toISOString() : undefined,
      dueAtLocal: body.dueAt ? new Date(String(body.dueAt)).toISOString() : undefined,
      comments: [],
    }
    db.todos.push(row as (typeof db.todos)[0])
    return row
  } },
  { method: 'PATCH', pattern: '/todos/:id', handle: ({ params, body }) => {
    const todo = requireRow(db.todos, params.id)
    Object.assign(todo, body)
    if (body.boardColumnId) {
      const col = findById(db.columns, String(body.boardColumnId))
      todo.boardColumnId = col?.id
      todo.boardColumnName = col?.name
      todo.status = col?.marksComplete ? 'Done' : todo.status === 'Done' ? 'InProgress' : todo.status
    }
    if (body.status === 'Done') {
      const done = db.columns.find((c) => c.marksComplete)
      if (done) {
        todo.boardColumnId = done.id
        todo.boardColumnName = done.name
      }
    }
    return todo
  } },
  { method: 'POST', pattern: '/todos/:id/schedule', handle: ({ params, body }) => {
    const todo = requireRow(db.todos, params.id)
    const event = {
      id: nid('ev'),
      title: todo.title,
      startAt: String(body.startAt ?? iso()),
      startAtUtc: String(body.startAt ?? iso()),
      responsibleUserId: USER.id,
      responsibleUserName: USER.name,
      clientId: todo.clientId,
      clientName: todo.clientName,
      linkedTodos: [{ id: todo.id, title: todo.title, status: todo.status }],
    }
    db.events.push(event as (typeof db.events)[0])
    todo.agendaEventId = event.id
    todo.agendaEventTitle = event.title
    return event
  } },
  { method: 'POST', pattern: '/todos/:id/comments', handle: ({ params, body }) => {
    const todo = requireRow(db.todos, params.id)
    const row = { id: nid('tc'), authorName: 'Juliana', content: String(body.content ?? body.text ?? ''), createdAt: iso() }
    todo.comments = todo.comments ?? []
    todo.comments.push(row)
    return row
  } },

  { method: 'GET', pattern: '/emails/accounts', handle: () => db.emailAccounts },
  { method: 'GET', pattern: '/emails/mailbox/:id', handle: ({ params, query }) => {
    const account = requireRow(db.emailAccounts, params.id)
    const folder = query.get('folder') ?? 'INBOX'
    return { account, messages: db.mailbox.filter((m) => m.folder === folder) }
  } },
  { method: 'GET', pattern: '/emails/scheduled', handle: () => db.scheduledEmails },
  { method: 'POST', pattern: '/emails/schedule', handle: ({ body }) => {
    const row = {
      id: nid('se'),
      clientId: body.clientId,
      clientName: clientName(body.clientId as string | undefined),
      toAddress: body.toAddress,
      subject: body.subject,
      body: body.body,
      status: 'Scheduled',
      scheduledAtUtc: body.sendAt ?? iso(2),
      providerKey: 'demo',
    }
    db.scheduledEmails.push(row)
    return row
  } },
  { method: 'POST', pattern: '/emails/schedule/:id/send-now', handle: ({ params }) => {
    const row = db.scheduledEmails.find((e) => e.id === params.id) as Json | undefined
    if (row) {
      row.status = 'Sent'
      row.sentAtUtc = iso()
    }
    return row
  } },
  { method: 'POST', pattern: '/emails/schedule/:id/cancel', handle: ({ params }) => {
    const row = db.scheduledEmails.find((e) => e.id === params.id) as Json | undefined
    if (row) row.status = 'Cancelled'
    return row
  } },

  { method: 'GET', pattern: '/whatsapp/inbox', handle: () => db.waInbox },
  { method: 'POST', pattern: '/whatsapp/send', handle: ({ body }) => {
    db.waInbox.unshift({ id: nid('wa'), from: 'me', contactName: 'Você', body: String(body.body ?? ''), receivedAtUtc: iso() })
    return { success: true, provider: 'dev-file', messageId: nid('wamid') }
  } },

  { method: 'GET', pattern: '/chat/peers', handle: () => [{ id: 'u-ju', name: 'Juliana', email: USER.email, isSelf: true }, { id: 'u-marina', name: 'Marina Souza', email: 'marina@fattovirtual.com' }] },
  { method: 'GET', pattern: '/chat/threads', handle: () => db.chatThreads },
  { method: 'POST', pattern: '/chat/threads', handle: ({ body }) => {
    const row = {
      id: nid('th'),
      title: body.self ? 'Notas' : String(body.title ?? 'Conversa'),
      lastMessage: '',
      lastAt: iso(),
      isSelf: Boolean(body.self),
      isGroup: Boolean(body.isGroup),
      isDirect: Boolean(body.peerUserId),
      participants: body.peerUserId
        ? [{ userId: USER.id, name: USER.name }, { userId: String(body.peerUserId), name: db.sharedUsers.find((u) => u.id === body.peerUserId)?.name ?? 'Colega' }]
        : [{ userId: USER.id, name: USER.name }],
    }
    db.chatThreads.unshift(row)
    return row
  } },
  { method: 'GET', pattern: '/chat/threads/:id/messages', handle: ({ params }) => db.chatMessages.filter((m) => m.threadId === params.id) },
  { method: 'POST', pattern: '/chat/threads/:id/messages', handle: ({ params, body }) => {
    const row = {
      id: nid('cm'),
      threadId: params.id,
      body: String(body.body ?? ''),
      authorName: USER.name,
      createdAt: iso(),
      mine: true,
      attachmentKind: body.attachmentKind as string | undefined,
      attachmentId: body.attachmentId as string | undefined,
    }
    db.chatMessages.push(row)
    const thread = findById(db.chatThreads, params.id)
    if (thread) {
      thread.lastMessage = row.body
      thread.lastAt = row.createdAt
    }
    return row
  } },

  { method: 'GET', pattern: '/organizations/me', handle: () => db.org },
  { method: 'PATCH', pattern: '/organizations/me', handle: ({ body }) => Object.assign(db.org, body) },
  { method: 'GET', pattern: '/users/me', handle: () => db.userProfile },
  { method: 'PATCH', pattern: '/users/me', handle: ({ body }) => Object.assign(db.userProfile, body) },
  { method: 'GET', pattern: '/access-types', handle: () => db.accessTypes },
  { method: 'POST', pattern: '/access-types', handle: ({ body }) => {
    const row = { id: nid('at'), name: String(body.name ?? 'Perfil'), permissions: (body.permissions as string[]) ?? [], isOwnerType: false, description: body.description as string | undefined }
    db.accessTypes.push(row)
    return row
  } },
  { method: 'GET', pattern: '/shared-users', handle: () => db.sharedUsers },
  { method: 'POST', pattern: '/shared-users', handle: ({ body }) => {
    const row = { id: nid('u'), name: String(body.name ?? 'Usuário'), email: String(body.email ?? ''), accessTypeId: String(body.accessTypeId ?? ''), accessTypeName: db.accessTypes.find((a) => a.id === body.accessTypeId)?.name, assignedClientIds: (body.assignedClientIds as string[]) ?? [], isOwner: false }
    db.sharedUsers.push(row)
    return row
  } },

  { method: 'GET', pattern: '/share-links', handle: () => db.shareLinks },
  { method: 'POST', pattern: '/share-links', handle: ({ body }) => {
    const row = {
      id: nid('sl'),
      token: nid('tok'),
      scope: String(body.scope ?? 'portal'),
      clientId: body.clientId as string | undefined,
      clientName: clientName(body.clientId as string | undefined),
      createdAt: iso(),
      isActive: true,
      allowMessages: true,
      allowUploads: true,
      expired: false,
    }
    db.shareLinks.push(row)
    return row
  } },
  { method: 'PATCH', pattern: '/share-links/:id', handle: ({ params, body }) => {
    const row = requireRow(db.shareLinks, params.id)
    Object.assign(row, body)
    return row
  } },
  { method: 'GET', pattern: '/public/share/:token', handle: ({ params }) => publicPortal(params.token) },
  { method: 'POST', pattern: '/public/share/:token/messages', handle: ({ params, body }) => {
    const link = db.shareLinks.find((s) => s.token === params.token)
    const row = { id: nid('pm'), clientId: link?.clientId ?? '', body: String(body.body ?? ''), fromContractor: true, authorLabel: String(body.authorName ?? 'Contratante'), createdAt: iso() }
    db.portalMessages.push(row)
    return row
  } },
  { method: 'POST', pattern: '/public/share/:token/documents', handle: ({ params, body }) => {
    const link = db.shareLinks.find((s) => s.token === params.token)
    const row = { id: nid('doc'), clientId: link?.clientId ?? '', title: String(body.title ?? 'Documento'), fileName: 'upload.bin', kind: String(body.kind ?? 'Proof'), uploadedBy: 'contractor', uploaderLabel: String(body.uploaderLabel ?? 'Contratante'), createdAt: iso() }
    db.documents.push(row)
    return row
  } },

  { method: 'GET', pattern: '/faqs', handle: () => db.faqs },
  { method: 'POST', pattern: '/faqs', handle: ({ body }) => {
    const row = { id: nid('faq'), question: String(body.question ?? ''), answer: String(body.answer ?? ''), sortOrder: db.faqs.length + 1, category: body.category as string | undefined, isPublished: body.isPublished !== false }
    db.faqs.push(row)
    return row
  } },
  { method: 'PUT', pattern: '/faqs/reorder', handle: ({ body }) => {
    const items = (Array.isArray(body.items) ? body.items : []) as { id: string; sortOrder: number }[]
    for (const item of items) {
      const faq = findById(db.faqs, item.id)
      if (faq) faq.sortOrder = item.sortOrder
    }
  } },
  { method: 'PUT', pattern: '/faqs/:id', handle: ({ params, body }) => {
    const row = requireRow(db.faqs, params.id)
    Object.assign(row, body)
    return row
  } },
  { method: 'DELETE', pattern: '/faqs/:id', handle: ({ params }) => {
    const i = db.faqs.findIndex((f) => f.id === params.id)
    if (i >= 0) db.faqs.splice(i, 1)
  } },
]

export function handleFakeApi(method: string, rawUrl: string, body: unknown): HttpResult {
  const url = new URL(rawUrl, 'http://local.fake')
  let path = url.pathname
  if (path.startsWith('/api/v1')) path = path.slice('/api/v1'.length) || '/'
  if (!path.startsWith('/')) path = `/${path}`

  try {
    for (const route of routes) {
      if (route.method !== method) continue
      const params = matchRoute(route.pattern, path)
      if (!params) continue
      const payload = route.handle({ params, query: url.searchParams, body: asJson(body) })
      if (payload === undefined) return { status: 204 }
      return { status: 200, body: payload }
    }
  } catch (error) {
    const err = error as { status?: number; payload?: unknown }
    if (err.status === 404) return { status: 404, body: err.payload ?? { detail: 'Não encontrado' } }
    throw error
  }

  if (method === 'GET') return { status: 200, body: [] }
  if (method === 'DELETE') return { status: 204 }
  return { status: 200, body: { id: nid('ok'), ...asJson(body) } }
}
