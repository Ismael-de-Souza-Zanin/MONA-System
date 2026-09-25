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
  await mobile.evaluate(() => localStorage.removeItem('mona_appearance_v1'))
  const submit = await mobile.$('button[type="submit"]')
  if (submit) {
    await submit.click()
    await mobile.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  } else {
    await mobile.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 })
    await mobile.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  }
  await new Promise((r) => setTimeout(r, 800))
  await mobile.screenshot({ path: path.join(out, 'brand-mobile.png') })
  console.log('ok')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
