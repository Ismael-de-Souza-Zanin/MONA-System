const puppeteer = require('puppeteer-core')
const path = require('path')

async function main() {
  const out = path.resolve(__dirname)
  const browser = await puppeteer.launch({
    executablePath:
      process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--hide-scrollbars'],
  })

  const mobile = await browser.newPage()
  await mobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await mobile.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  const submit = await mobile.$('button[type="submit"]')
  if (submit) {
    await submit.click()
    await mobile.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  }
  await new Promise((r) => setTimeout(r, 800))
  await mobile.screenshot({ path: path.join(out, 'home-mobile.png') })
  await mobile.evaluate(() => window.scrollTo(0, 420))
  await new Promise((r) => setTimeout(r, 300))
  await mobile.screenshot({ path: path.join(out, 'home-mobile-lower.png') })

  const more = await mobile.$('button[aria-label="Mais"], .mona-sidebar__link.is-labeled')
  const buttons = await mobile.$$('.mona-sidebar.is-mobile-dock button, .mona-sidebar.is-mobile-dock a')
  for (const btn of buttons) {
    const label = await btn.evaluate((el) => el.getAttribute('aria-label') || el.textContent || '')
    if (/mais/i.test(label)) {
      await btn.click()
      break
    }
  }
  await new Promise((r) => setTimeout(r, 400))
  await mobile.screenshot({ path: path.join(out, 'home-mobile-more.png') })

  const desk = await browser.newPage()
  await desk.setViewport({ width: 1280, height: 800 })
  await desk.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 600))
  const sidebar = await desk.$('.mona-sidebar')
  if (sidebar) await sidebar.screenshot({ path: path.join(out, 'home-sidebar.png') })
  await desk.screenshot({ path: path.join(out, 'home-desktop.png') })
  console.log('ok')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
