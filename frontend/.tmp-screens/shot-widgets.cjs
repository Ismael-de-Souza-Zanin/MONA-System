const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')

const OUT = path.resolve(__dirname, '..', 'src', 'features', 'landing', 'captures', 'widgets')

async function snap(page, selector, file) {
  const el = await page.$(selector)
  if (!el) {
    console.log('missing', selector)
    return
  }
  await el.screenshot({ path: path.join(OUT, file) })
  console.log(file)
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath:
      process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  })
  const page = await browser.newPage()
  page.setDefaultTimeout(30000)
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => {
    localStorage.setItem('fatto_access_token', 'fake-access-token')
    localStorage.setItem('fatto_refresh_token', 'fake-refresh-token')
  })

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-hero--stage', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 900))

  await snap(page, '.mona-hero--stage', 'hero.png')
  await snap(page, '.mona-hero__card', 'hoje.png')

  const kpis = await page.$$('.mona-home__desktop.grid.gap-4.pt-2 a')
  const kpiNames = ['clientes', 'financeiro', 'onboarding', 'tarefas']
  for (let i = 0; i < Math.min(kpis.length, kpiNames.length); i += 1) {
    await kpis[i].screenshot({ path: path.join(OUT, `kpi-${kpiNames[i]}.png`) })
    console.log(`kpi-${kpiNames[i]}.png`)
  }

  const docks = await page.$$('.mona-stack__card')
  if (docks[0]) {
    await docks[0].screenshot({ path: path.join(OUT, 'tarefas.png') })
    console.log('tarefas.png')
  }
  if (docks[1]) {
    await docks[1].screenshot({ path: path.join(OUT, 'agenda.png') })
    console.log('agenda.png')
  }

  await page.goto('http://localhost:5173/clientes/c-ana', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-canvas', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 900))
  await snap(page, '.mona-desktop-only.mb-5, .mona-desktop-only > .mb-5, .mb-5.mona-desktop-only', 'cliente.png')
  const clientCard = await page.$('.mona-desktop-only.mb-5') || await page.$('main .mona-card, main [class*="rounded"]')
  if (clientCard) {
    await clientCard.screenshot({ path: path.join(OUT, 'cliente.png') })
    console.log('cliente.png')
  }

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === 'Financeiro')
    if (btn) btn.click()
  })
  await new Promise((r) => setTimeout(r, 700))
  const finance = await page.$('.mona-canvas__main')
  if (finance) {
    const box = await page.evaluate(() => {
      const tab = document.querySelector('[class*="space-y"], main .mona-canvas__main > div:last-child')
      return null
    })
    void box
  }
  const financeBlock = await page.$$('main .mona-card, main [class*="rounded-"]')
  if (financeBlock[1]) {
    await financeBlock[1].screenshot({ path: path.join(OUT, 'cliente-financeiro.png') })
    console.log('cliente-financeiro.png')
  }

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
