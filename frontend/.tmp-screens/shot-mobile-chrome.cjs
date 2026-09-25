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
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })
  await page.goto('http://localhost:5173/clientes', { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 600))
  const href = await page.evaluate(() => {
    const a = document.querySelector('a[href^="/clientes/"]')
    return a?.getAttribute('href')
  })
  if (href) {
    await page.goto('http://localhost:5173' + href, { waitUntil: 'networkidle0', timeout: 20000 })
    await new Promise((r) => setTimeout(r, 700))
  }
  const info = await page.evaluate(() => ({
    crumbs: document.querySelector('.mona-crumbs')?.textContent?.replace(/\s+/g, ' ').trim(),
    labels: [...document.querySelectorAll('.mona-sidebar__link-caption')].map((el) => el.textContent),
    tabs: Boolean(document.querySelector('.mona-pathbar .mona-tabbar__more')),
    logo: Boolean(document.querySelector('.mona-topbar__logo')),
  }))
  console.log(JSON.stringify(info))
  await page.screenshot({ path: path.join(out, 'defaults-mobile-fan.png'), fullPage: false })
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
