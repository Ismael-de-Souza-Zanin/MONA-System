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
    args: ['--hide-scrollbars', '--use-gl=angle', '--enable-webgl'],
    defaultViewport: { width: 1280, height: 800 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))

  await page.goto('http://localhost:5173/conheca', { waitUntil: 'networkidle0', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 3200))
  const first = await page.evaluate(() => ({
    path: location.pathname,
    title: document.querySelector('.mona-land__card.is-on .mona-land__title')?.textContent,
    num: document.querySelector('.mona-land__card.is-on .mona-land__num')?.textContent,
    canvas: Boolean(document.querySelector('canvas.mona-land__canvas')),
  }))
  await page.screenshot({ path: path.join(out, 'land-hero.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.12))
  await new Promise((r) => setTimeout(r, 900))
  const mid = await page.evaluate(() => document.querySelector('.mona-land__card.is-on .mona-land__num')?.textContent)
  await page.screenshot({ path: path.join(out, 'land-mid.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.24))
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'land-merge.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.36))
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: path.join(out, 'land-portal.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.42))
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'land-through.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.52))
  await new Promise((r) => setTimeout(r, 900))
  await page.screenshot({ path: path.join(out, 'land-tour.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.62))
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'land-late.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.725))
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'land-scan.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.825))
  await new Promise((r) => setTimeout(r, 800))
  await page.screenshot({ path: path.join(out, 'land-arch.png'), fullPage: false })

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await new Promise((r) => setTimeout(r, 700))
  const end = await page.evaluate(() => ({
    num: document.querySelector('.mona-land__card.is-on .mona-land__num')?.textContent,
    title: document.querySelector('.mona-land__card.is-on .mona-land__title')?.textContent,
  }))
  await page.screenshot({ path: path.join(out, 'land-cta.png'), fullPage: false })

  console.log(JSON.stringify({ first, mid, end, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
