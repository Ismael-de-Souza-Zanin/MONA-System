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
  await page.goto('http://localhost:5173/todos', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 700))

  const info = await page.evaluate(() => {
    const aside = document.querySelector('.mona-sidebar')
    const rect = aside?.getBoundingClientRect()
    const items = [...document.querySelectorAll('.mona-sidebar.is-mobile-dock .mona-sidebar__link, .mona-sidebar.is-mobile-dock .mona-sidebar__cta')]
    return {
      dock: aside?.classList.contains('is-mobile-dock'),
      left: rect ? Math.round(rect.left) : null,
      bottom: rect ? Math.round(window.innerHeight - rect.bottom) : null,
      top: rect ? Math.round(rect.top) : null,
      width: rect ? Math.round(rect.width) : null,
      height: rect ? Math.round(rect.height) : null,
      itemCount: items.length,
      lastRight: items.at(-1) ? Math.round(items.at(-1).getBoundingClientRect().right) : null,
      hamburger: Boolean(document.querySelector('[aria-label="Abrir menu"]')),
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })

  const fan = await page.$('.mona-fan button')
  if (fan) {
    await fan.click()
    await new Promise((r) => setTimeout(r, 500))
  }
  const fanInfo = await page.evaluate(() => ({
    open: Boolean(document.querySelector('.mona-fan__list.is-open')),
    count: document.querySelectorAll('.mona-fan__list.is-open .mona-fan__item').length,
  }))
  await page.screenshot({ path: path.join(out, 'defaults-mobile-fan.png'), fullPage: false })

  console.log(JSON.stringify({ info, fanInfo, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
