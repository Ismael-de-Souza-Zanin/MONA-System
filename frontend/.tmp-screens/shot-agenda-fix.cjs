const puppeteer = require('puppeteer-core')
const path = require('path')

async function main() {
  const out = path.resolve(__dirname)
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
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 600))

  const first = await page.evaluate(() => ({
    path: location.pathname,
    kicker: document.querySelector('.mona-m-calhead .mona-m-kicker')?.textContent,
    month: document.querySelector('.mona-m-calhead__month')?.textContent,
    week: [...document.querySelectorAll('.mona-m-week button')].map((el) => el.textContent?.replace(/\s+/g, ' ').trim()),
    next: document.querySelector('.mona-m-next strong')?.textContent || null,
    dayHead: document.querySelector('.mona-m-dayhead h2')?.textContent,
    events: document.querySelectorAll('.mona-m-event').length,
    hero: Boolean(document.querySelector('.mona-mobile-only .mona-m-hero')),
    desktop: Boolean(document.querySelector('.mona-desktop-only .fv-page-header, .mona-desktop-only h1')),
  }))
  await page.screenshot({ path: path.join(out, 'agenda-fixed.png'), fullPage: false })

  await page.click('.mona-m-calhead__nav button[aria-label="Próxima semana"]')
  await new Promise((r) => setTimeout(r, 200))
  const nextWeek = await page.evaluate(() => document.querySelector('.mona-m-calhead__month')?.textContent)

  await page.click('.mona-m-calhead__nav .is-today')
  await new Promise((r) => setTimeout(r, 200))
  const backToday = await page.evaluate(() => document.querySelector('.mona-m-dayhead h2')?.textContent)

  await page.click('.mona-m-fab')
  await page.waitForSelector('[role="dialog"], .mona-modal, h2', { timeout: 4000 }).catch(() => null)
  const modal = await page.evaluate(() => document.body.innerText.includes('Novo evento'))

  await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false })
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 500))
  const desktop = await page.evaluate(() => {
    const mobile = document.querySelector('.mona-mobile-only')
    const desk = document.querySelector('.mona-desktop-only')
    return {
      mobileHidden: !mobile || getComputedStyle(mobile).display === 'none',
      desktopShown: Boolean(desk && getComputedStyle(desk).display !== 'none'),
      header: document.querySelector('.mona-desktop-only h1, .mona-desktop-only h2')?.textContent || null,
      cards: document.querySelectorAll('.mona-desktop-only [class*="Card"], .mona-desktop-only .border-l-4').length,
    }
  })
  await page.screenshot({ path: path.join(out, 'agenda-desktop.png'), fullPage: false })

  console.log(JSON.stringify({ first, nextWeek, backToday, modal, desktop, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
