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
  await new Promise((r) => setTimeout(r, 700))

  const dock = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('.mona-sidebar.is-mobile-dock .mona-sidebar__link-caption')].map(
      (el) => el.textContent?.trim(),
    )
    const fans = document.querySelectorAll('.mona-sidebar.is-mobile-dock .mona-fan').length
    return { labels, fans, more: Boolean(document.querySelector('.mona-sidebar__more')) }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })

  await page.click('.mona-sidebar__more')
  await page.waitForSelector('.mona-more-sheet', { timeout: 8000 })
  await new Promise((r) => setTimeout(r, 400))
  const sheet = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.mona-more-sheet .mona-sidebar__group-toggle, .mona-more-sheet .mona-sidebar__group-label')].map(
      (el) => el.textContent?.replace(/\s+/g, ' ').trim(),
    )
    const links = [...document.querySelectorAll('.mona-more-sheet__link')].map((el) => el.textContent?.trim())
    return { groups, links }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile-fan.png'), fullPage: false })

  const prestadores = await page.$('a.mona-more-sheet__link[href="/prestadores"]')
  if (prestadores) {
    await prestadores.click()
    await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 8000 })
    await new Promise((r) => setTimeout(r, 500))
  }
  const after = await page.evaluate(() => ({
    path: location.pathname,
    sheet: Boolean(document.querySelector('.mona-more-sheet')),
    moreActive: Boolean(document.querySelector('.mona-sidebar__more.is-active')),
  }))
  await page.screenshot({ path: path.join(out, 'defaults-mobile-agenda.png'), fullPage: false })

  console.log(JSON.stringify({ dock, sheet, after, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
