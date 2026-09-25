const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')

const OUT = path.resolve(__dirname, '..', 'src', 'features', 'landing', 'captures')
const PAGES = [
  { file: 'dash.png', route: '/' },
  { file: 'agenda.png', route: '/agenda' },
  { file: 'todos.png', route: '/todos' },
  { file: 'financeiro.png', route: '/financeiro' },
  { file: 'emails.png', route: '/emails' },
  { file: 'whatsapp.png', route: '/whatsapp' },
  { file: 'clientes.png', route: '/clientes' },
  { file: 'cliente.png', route: '/clientes/c-ana' },
  { file: 'sops.png', route: '/sops' },
  { file: 'onboarding.png', route: '/onboarding' },
  { file: 'operacao.png', route: '/operacao' },
  { file: 'contratos.png', route: '/contratos' },
  { file: 'servicos.png', route: '/servicos' },
  { file: 'relatorios.png', route: '/relatorios' },
]

async function shot(page, file) {
  await new Promise((r) => setTimeout(r, 1100))
  const canvas = await page.$('.mona-canvas')
  const target = canvas || page
  await target.screenshot({ path: path.join(OUT, file) })
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath:
      process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => {
    localStorage.setItem('fatto_access_token', 'fake-access-token')
    localStorage.setItem('fatto_refresh_token', 'fake-refresh-token')
  })

  for (const item of PAGES) {
    await page.goto(`http://localhost:5173${item.route}`, { waitUntil: 'networkidle0', timeout: 30000 })
    await page.waitForSelector('.mona-canvas', { timeout: 20000 })
    await shot(page, item.file)
    console.log(item.file)
  }

  await page.goto('http://localhost:5173/clientes/c-ana', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-canvas', { timeout: 20000 })
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Financeiro')
    if (btn) btn.click()
  })
  await shot(page, 'cliente-financeiro.png')
  console.log('cliente-financeiro.png')

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
