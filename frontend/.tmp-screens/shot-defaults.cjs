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
    args: ['--window-size=1440,900', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => {
    localStorage.setItem('fatto_sidebar_collapsed', '1')
    localStorage.removeItem('mona_appearance_v1')
  })
  await page.reload({ waitUntil: 'networkidle0' })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-compact', { timeout: 20000 })
  await page.waitForSelector('.mona-workspace', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 800))

  const desktop = await page.evaluate(() => {
    const aside = document.querySelector('.mona-sidebar')
    const rect = aside?.getBoundingClientRect()
    const stored = JSON.parse(localStorage.getItem('mona_appearance_v1') || '{}')
    return {
      left: rect ? Math.round(rect.left) : null,
      bottom: rect ? Math.round(window.innerHeight - rect.bottom) : null,
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null,
      mobileDock: aside?.classList.contains('is-mobile-dock'),
      checks: document.querySelectorAll('.mona-checklist input[type="checkbox"]').length,
      notch: stored.chrome && {
        notchSize: stored.chrome.notchSize,
        notchDepth: stored.chrome.notchDepth,
        notchScoop: stored.chrome.notchScoop,
        notchPop: stored.chrome.notchPop,
        notchCircle: stored.chrome.notchCircle,
        notchShadow: stored.chrome.notchShadow,
        tabStyle: stored.chrome.tabStyle,
        sidebarBg: stored.chrome.sidebarBg,
      },
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-dash.png'), fullPage: false })

  await page.goto('http://localhost:5173/todos', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-workspace', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 700))
  const todos = await page.evaluate(() => ({
    checks: document.querySelectorAll('.mona-checklist input[type="checkbox"]').length,
    labels: [...document.querySelectorAll('.mona-checklist label')].slice(0, 3).map((el) => el.textContent),
  }))
  await page.screenshot({ path: path.join(out, 'defaults-todos.png'), fullPage: false })

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-sidebar', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 800))
  const mobile = await page.evaluate(() => {
    const aside = document.querySelector('.mona-sidebar')
    const rect = aside?.getBoundingClientRect()
    return {
      mobileDock: aside?.classList.contains('is-mobile-dock'),
      left: rect ? Math.round(rect.left) : null,
      top: rect ? Math.round(rect.top) : null,
      bottom: rect ? Math.round(window.innerHeight - rect.bottom) : null,
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null,
      hamburger: Boolean(document.querySelector('[aria-label="Abrir menu"]')),
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })

  console.log(JSON.stringify({ desktop, todos, mobile, pageerrors: errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
