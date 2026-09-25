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
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 800))
  const info = await page.evaluate(() => {
    const dock = document.querySelector('.mona-sidebar')
    const inner = document.querySelector('.mona-sidebar .is-notch-item .mona-sidebar__link-inner')
    const ir = inner?.getBoundingClientRect()
    return {
      notchX: dock ? getComputedStyle(dock).getPropertyValue('--mona-notch-x').trim() : null,
      mask: dock ? getComputedStyle(dock).getPropertyValue('--mona-notch-mask-size').trim() : null,
      circle: ir ? Math.round(ir.width) : null,
      center: ir ? Math.round(ir.left + ir.width / 2) : null,
    }
  })
  console.log(JSON.stringify(info))
  await page.screenshot({
    path: path.join(out, 'defaults-mobile-dock.png'),
    clip: { x: 0, y: 700, width: 390, height: 144 },
  })
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
