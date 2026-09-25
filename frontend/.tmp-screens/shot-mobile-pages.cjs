const puppeteer = require('puppeteer-core')
const path = require('path')
const fs = require('fs')

const ROUTES = ['/', '/todos', '/chat', '/configuracoes']

async function main() {
  const out = path.resolve(__dirname)
  const shots = path.join(out, 'mobile-pages')
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
  await page.screenshot({ path: path.join(shots, 'login.png'), fullPage: false })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })

  const report = []
  for (const route of ROUTES) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 450))
    const info = await page.evaluate(() => {
      const main = document.querySelector('.mona-canvas__main')
      const overflowing = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 8 && r.right > window.innerWidth + 2
        })
        .slice(0, 8)
        .map((el) => ({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 80),
          right: Math.round(el.getBoundingClientRect().right),
        }))
      return {
        path: location.pathname,
        docWidth: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        mainScroll: main ? Math.round(main.scrollWidth) : null,
        overflow: overflowing,
      }
    })
    const name = route === '/' ? 'home' : route.replace(/\W+/g, '-').replace(/^-/, '')
    await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: false })
    report.push(info)
  }

  const clients = await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle0' })
  await page.waitForSelector('a[href^="/clientes/"]', { timeout: 8000 }).catch(() => null)
  const first = await page.$('a[href^="/clientes/"]')
  if (first) {
    await first.click()
    await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 8000 })
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot({ path: path.join(shots, 'cliente-detalhe.png'), fullPage: false })
  }

  console.log(JSON.stringify({ report, errors, clients: Boolean(clients) }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
