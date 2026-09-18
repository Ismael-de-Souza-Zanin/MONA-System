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

  const chrome = await page.evaluate(() => {
    const workspace = document.querySelector('.mona-workspace')
    const dock = document.querySelector('.mona-dock')
    const command = document.querySelector('.mona-command')
    const stack = document.querySelectorAll('.mona-stack__card')
    const pin = document.querySelector('.mona-panel--pin')
    const tools = document.querySelector('.mona-panel--tools')
    const user = tools?.querySelector('[aria-haspopup="menu"]')
    return {
      workspace: Boolean(workspace),
      dock: Boolean(dock),
      command: Boolean(command),
      stackCount: stack.length,
      pin: pin?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80),
      userInTools: Boolean(user),
    }
  })
  console.log('chrome', JSON.stringify(chrome, null, 2))

  await page.click('.mona-panel--pin')
  await page.waitForSelector('h1, .mona-page__title, [class*="Agenda"]', { timeout: 15000 }).catch(() => {})
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'bento-agenda.png'), fullPage: false })

  await page.click('button[aria-label^="Gestão"]')
  await new Promise((r) => setTimeout(r, 600))
  await page.screenshot({ path: path.join(out, 'bento-fan.png'), fullPage: false })

  await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.waitForSelector('.mona-workspace', { timeout: 15000 })
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'bento-clientes.png'), fullPage: false })

  const tab = await page.$('.mona-stack__card')
  if (tab) await tab.click()
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'bento-tab.png'), fullPage: false })

  console.log('pageerrors', errors)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
