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
  await page.evaluate(() => localStorage.setItem('fatto_sidebar_collapsed', '1'))
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-compact', { timeout: 20000 })
  await page.waitForSelector('.mona-workspace', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 900))

  await page.screenshot({ path: path.join(out, 'bento-dash.png'), fullPage: false })

  await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-workspace', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'bento-clientes.png'), fullPage: false })

  const chrome = await page.evaluate(() => ({
    tabs: Boolean(document.querySelector('.mona-tabbar, .mona-tab')),
    search: Boolean(document.querySelector('.mona-topbar .mona-search')),
    command: Boolean(document.querySelector('.mona-command')),
    dayHeads: [...document.querySelectorAll('.mona-day__head')].map((el) => el.textContent?.replace(/\s+/g, ' ').trim()),
  }))
  console.log('chrome', JSON.stringify(chrome, null, 2))

  console.log('pageerrors', errors)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
