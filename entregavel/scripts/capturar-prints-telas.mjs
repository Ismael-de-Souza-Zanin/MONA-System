import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 127.0.0.1 evita o localhost IPv6, que neste Windows aponta para outro app na 5173.
const BASE = process.env.APP_URL || 'http://127.0.0.1:5173'
const OUT = path.resolve(__dirname, '..', 'prints-telas')
const EMAIL = 'ju@fattovirtual.com'
const PASSWORD = 'Admin123!'

const shots = []

function slug(n, name) {
  return `${String(n).padStart(2, '0')}-${name}`
}

async function waitReady(page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  await page.getByText('Carregando...').first().waitFor({ state: 'hidden', timeout: 12_000 }).catch(() => {})
  await page.waitForTimeout(500)
}

async function shot(page, n, name, title) {
  await waitReady(page)
  const file = `${slug(n, name)}.png`
  await page.screenshot({ path: path.join(OUT, file), fullPage: true })
  shots.push({ n, file, title, url: page.url() })
  console.log(`  ${file}`)
}

async function apiGet(page, apiPath) {
  return page.evaluate(async (p) => {
    const token = localStorage.getItem('fatto_access_token')
    const res = await fetch(`/api/v1${p}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return res.json()
  }, apiPath)
}

async function apiPost(page, apiPath, body) {
  return page.evaluate(async ({ p, body }) => {
    const token = localStorage.getItem('fatto_access_token')
    const res = await fetch(`/api/v1${p}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return res.json()
  }, { p: apiPath, body })
}

async function clickClientTab(page, label) {
  const bar = page.locator('div.mb-5.flex.gap-1')
  const btn = bar.getByRole('button', { name: label, exact: true })
  await btn.click()
  await page.waitForTimeout(500)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.png') || x === 'README.md')) {
    fs.unlinkSync(path.join(OUT, f))
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'pt-BR',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)

  let n = 1

  console.log('Login...')
  await page.goto(`${BASE}/login`)
  await page.getByText('Bem-vinda de volta').waitFor({ timeout: 20_000 })
  await shot(page, n++, 'login', 'Login')

  await page.locator('#e-mail').fill(EMAIL)
  await page.locator('#senha').fill(PASSWORD)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
  await waitReady(page)

  const routes = [
    ['/', 'dashboard', 'Dashboard'],
    ['/operacao', 'operacao', 'Modo operação'],
    ['/clientes', 'clientes', 'Clientes'],
    ['/todos', 'tarefas', 'Tarefas'],
    ['/agenda', 'agenda', 'Agenda'],
    ['/notificacoes', 'alertas', 'Alertas'],
    ['/financeiro', 'financeiro', 'Financeiro'],
    ['/contratos', 'contratos', 'Contratos'],
    ['/onboarding', 'onboarding', 'Onboarding'],
    ['/prestadores', 'prestadores', 'Prestadores'],
    ['/piramide', 'piramide', 'Pirâmide'],
    ['/parceiras', 'parceiras', 'Empresas parceiras'],
    ['/servicos', 'servicos', 'Serviços'],
    ['/sops', 'procedimentos', 'Procedimentos (SOPs)'],
    ['/sops/nova', 'procedimento-novo', 'Novo procedimento'],
    ['/apps', 'apps', 'Catálogo de apps'],
    ['/emails', 'emails', 'E-mails'],
    ['/whatsapp', 'whatsapp', 'WhatsApp'],
    ['/chat', 'chat', 'Chat interno'],
    ['/compartilhar', 'portal-links', 'Portal do contratante (links)'],
    ['/faqs', 'faqs', 'FAQs'],
  ]

  for (const [pathName, file, title] of routes) {
    console.log(title)
    await page.goto(`${BASE}${pathName}`)
    await shot(page, n++, file, title)
  }

  const settingsTabs = [
    ['people', 'config-pessoas', 'Configurações — Pessoas e acessos'],
    ['access', 'config-tipos-acesso', 'Configurações — Tipos de acesso'],
    ['org', 'config-empresa', 'Configurações — Empresa'],
    ['user', 'config-perfil', 'Configurações — Meu perfil'],
    ['appearance', 'config-aparencia', 'Configurações — Aparência'],
  ]
  for (const [tab, file, title] of settingsTabs) {
    console.log(title)
    await page.goto(`${BASE}/configuracoes?tab=${tab}`)
    await shot(page, n++, file, title)
  }

  const clients = (await apiGet(page, '/clients')) || []
  const client = Array.isArray(clients) ? clients[0] : null
  if (client?.id) {
    const clientTabs = [
      ['Resumo', 'cliente-resumo'],
      ['Aplicativos', 'cliente-apps'],
      ['Acessos', 'cliente-acessos'],
      ['CRM', 'cliente-crm'],
      ['Portal', 'cliente-portal'],
      ['Financeiro', 'cliente-financeiro'],
      ['Contrato', 'cliente-contrato'],
      ['Invoices', 'cliente-invoices'],
      ['Serviços', 'cliente-servicos'],
      ['Parceiros', 'cliente-parceiros'],
    ]
    await page.goto(`${BASE}/clientes/${client.id}`)
    await waitReady(page)
    for (const [label, file] of clientTabs) {
      console.log(`Ficha cliente — ${label}`)
      await clickClientTab(page, label)
      await shot(page, n++, file, `Ficha do cliente — ${label} (${client.name || 'cliente'})`)
    }
  }

  const employees = (await apiGet(page, '/employees')) || []
  const employee = Array.isArray(employees) ? employees[0] : null
  if (employee?.id) {
    console.log('Resumo prestador')
    await page.goto(`${BASE}/prestadores/${employee.id}`)
    await shot(page, n++, 'prestador-resumo', `Resumo do prestador (${employee.name || 'prestador'})`)
  }

  let sops = await apiGet(page, '/sops')
  if (sops && !Array.isArray(sops) && Array.isArray(sops.items)) sops = sops.items
  const sop = Array.isArray(sops) ? sops[0] : null
  if (sop?.id) {
    console.log('Detalhe SOP')
    await page.goto(`${BASE}/sops/${sop.id}`)
    await shot(page, n++, 'procedimento-detalhe', `Procedimento — detalhe (${sop.name || sop.title || 'SOP'})`)
    await page.goto(`${BASE}/sops/${sop.id}/editar`)
    await shot(page, n++, 'procedimento-editar', `Procedimento — editar (${sop.name || sop.title || 'SOP'})`)
  }

  let portalToken = null
  const links = (await apiGet(page, '/share-links')) || []
  if (Array.isArray(links) && links[0]?.token) {
    portalToken = links[0].token
  } else if (client?.id) {
    const created = await apiPost(page, '/share-links', {
      scope: 'portal',
      clientId: client.id,
      allowMessages: true,
      allowUploads: true,
      shareContactInfo: true,
    })
    portalToken = created?.token
  }

  if (portalToken) {
    console.log('Portal do contratante')
    const portal = await context.newPage()
    await portal.goto(`${BASE}/s/${portalToken}`)
    await shot(portal, n++, 'portal-contratante', 'Área do contratante (link público)')
    await portal.close()
  }

  await browser.close()

  const lines = [
    '# Prints de tela — FattoVirtual',
    '',
    `Capturados em ${new Date().toISOString()} a partir de ${BASE}.`,
    'Viewport: 1440×900, página inteira (scroll).',
    'Login: `ju@fattovirtual.com`.',
    '',
    '| # | Arquivo | Tela | URL |',
    '|---|---------|------|-----|',
    ...shots.map((s) => `| ${s.n} | [${s.file}](./${s.file}) | ${s.title} | ${s.url} |`),
    '',
  ]
  fs.writeFileSync(path.join(OUT, 'README.md'), lines.join('\n'), 'utf8')
  console.log(`\n${shots.length} prints em ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
