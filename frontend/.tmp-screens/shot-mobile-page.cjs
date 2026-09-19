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
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 700))
  const box = await page.evaluate(() => {
    const canvas = document.querySelector('.mona-canvas')
    const dock = document.querySelector('.mona-sidebar')
    const day = document.querySelector('.mona-dock__stack')
    const cr = canvas?.getBoundingClientRect()
    const dr = dock?.getBoundingClientRect()
    return {
      canvasW: cr ? Math.round(cr.width) : null,
      canvasRight: cr ? Math.round(cr.right) : null,
      vw: window.innerWidth,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
      dockLeft: dr ? Math.round(dr.left) : null,
      dockRight: dr ? Math.round(dr.right) : null,
      dockBottom: dr ? Math.round(window.innerHeight - dr.bottom) : null,
      dayHidden: !day || getComputedStyle(day).display === 'none',
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })
  console.log(JSON.stringify({ box, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
