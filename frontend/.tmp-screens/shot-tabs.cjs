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
  await page.waitForSelector('.mona-sidebar.is-compact', { timeout: 20000 })
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.goto('http://localhost:5173/todos', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 700))

  const mobile = await page.evaluate(() => {
    const aside = document.querySelector('.mona-sidebar')
    const rect = aside?.getBoundingClientRect()
    return {
      mobileDock: aside?.classList.contains('is-mobile-dock'),
      compact: aside?.classList.contains('is-compact'),
      left: rect ? Math.round(rect.left) : null,
      top: rect ? Math.round(rect.top) : null,
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null,
      hamburger: Boolean(document.querySelector('[aria-label="Abrir menu"]')),
      tabMore: Boolean(document.querySelector('.mona-tabbar__more')),
      tabCount: document.querySelector('.mona-tabbar__more span')?.textContent,
      current: document.querySelector('.mona-tabbar__current')?.textContent?.trim(),
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })

  await page.evaluate(() => document.querySelector('.mona-tabbar__more')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  await page.waitForSelector('.mona-tablist', { timeout: 5000 })
  const list = await page.evaluate(() =>
    [...document.querySelectorAll('.mona-tablist__open')].map((el) => el.textContent?.replace(/\s+/g, ' ').trim()),
  )
  await page.screenshot({ path: path.join(out, 'defaults-mobile-fan.png'), fullPage: false })

  await page.setViewport({ width: 1440, height: 900, isMobile: false })
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 500))
  await page.screenshot({ path: path.join(out, 'defaults-dash.png'), fullPage: false })

  console.log(JSON.stringify({ mobile, list, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
