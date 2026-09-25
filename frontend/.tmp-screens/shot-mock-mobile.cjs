const puppeteer = require('puppeteer-core')
const path = require('path')
const fs = require('fs')

const ROUTES = [
  ['/', 'home'],
  ['/clientes', 'clientes'],
  ['/todos', 'todos'],
  ['/agenda', 'agenda'],
  ['/financeiro', 'financeiro'],
  ['/relatorios', 'relatorios'],
  ['/operacao', 'operacao'],
  ['/contratos', 'contratos'],
  ['/configuracoes', 'configuracoes'],
  ['/mais', 'mais'],
  ['/whatsapp', 'whatsapp'],
  ['/compartilhar', 'portal'],
  ['/prestadores', 'prestadores'],
  ['/sops', 'sops'],
  ['/onboarding', 'onboarding'],
  ['/emails', 'emails'],
  ['/servicos', 'servicos'],
  ['/parceiras', 'parceiras'],
]

async function main() {
  const shots = path.join(__dirname, 'mock-mobile')
  fs.mkdirSync(shots, { recursive: true })
  const edge =
    process.env.EDGE_PATH ||
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  const browser = await puppeteer.launch({
    executablePath: edge,
    headless: true,
    args: ['--hide-scrollbars'],
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  for (const [route] of ROUTES.slice(0, 4)) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0', timeout: 30000 })
  }

  const report = []
  for (const [route, name] of ROUTES) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 500))
    const info = await page.evaluate(() => ({
      path: location.pathname,
      hero: Boolean(document.querySelector('.mona-m-hero, .mona-m-profile')),
      mobileOnly: document.querySelectorAll('.mona-mobile-only').length,
      title: document.querySelector('.mona-m-title, .mona-m-profile strong, h1')?.textContent?.trim(),
    }))
    await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: false })
    report.push({ name, ...info })
  }

  await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle0' })
  await page.waitForSelector('a[href^="/clientes/"]', { timeout: 8000 }).catch(() => null)
  const first = await page.$('.mona-mobile-only a[href^="/clientes/"]')
  if (first) {
    await first.click()
    await page.waitForSelector('.mona-m-profile', { timeout: 8000 }).catch(() => null)
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(shots, 'cliente-detalhe.png'), fullPage: false })
  }

  console.log(JSON.stringify({ report, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
