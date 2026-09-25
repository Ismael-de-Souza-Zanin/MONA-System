const puppeteer = require('puppeteer-core')
const path = require('path')

;(async () => {
  const out = path.resolve(__dirname)
  const browser = await puppeteer.launch({
    executablePath: process.env.EDGE_PATH,
    headless: true,
    args: ['--window-size=1440,900', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  await page.type('input[type="email"]', 'ju@fattovirtual.com')
  await page.type('input[type="password"]', 'Admin123!')
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 700))

  const check = async (route, file, selector) => {
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 600))
    const info = await page.evaluate((sel) => {
      const shell = document.querySelector('.mona-shell')
      const mobile = document.querySelector('.mona-mobile-only, .mona-home__mobile')
      const desktop = document.querySelector('.mona-desktop-only, .mona-home__desktop, .mona-hero--stage')
      const hero = document.querySelector('.mona-m-hero')
      const cs = (el) => (el ? getComputedStyle(el).display : null)
      return {
        isMobile: shell?.classList.contains('is-mobile'),
        mobileDisplay: cs(mobile),
        desktopDisplay: cs(desktop),
        heroDisplay: cs(hero),
        hasSel: sel ? !!document.querySelector(sel) : true,
      }
    }, selector)
    await page.screenshot({ path: path.join(out, file) })
    return { route, ...info }
  }

  const results = []
  results.push(await check('/', 'desk-home.png', '.mona-m-hero'))
  results.push(await check('/todos', 'desk-todos.png', '.mona-m-hero'))
  results.push(await check('/clientes', 'desk-clientes.png', '.mona-m-hero'))
  results.push(await check('/agenda', 'desk-agenda.png', '.mona-m-hero'))
  results.push(await check('/configuracoes', 'desk-settings.png', '.mona-m-profile'))
  results.push(await check('/apps', 'desk-apps.png', '.mona-m-hero'))
  console.log(JSON.stringify({ results, errors }, null, 2))
  await browser.close()
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
