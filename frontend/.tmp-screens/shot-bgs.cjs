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
    defaultViewport: { width: 1440, height: 820 },
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(String(err)))
  await page.goto('http://localhost:5173/conheca', { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForSelector('.mona-land__bg', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 2800))

  const hero = await page.evaluate(() => {
    const bgs = [...document.querySelectorAll('.mona-land__bg')].map((img) => ({
      src: img.getAttribute('src')?.slice(-20),
      opacity: getComputedStyle(img).opacity,
      natural: img.naturalWidth,
    }))
    const canvas = document.querySelector('.mona-land__canvas')
    return {
      bgs,
      canvasBg: canvas ? getComputedStyle(canvas).backgroundColor : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
    }
  })
  await page.screenshot({ path: path.join(out, 'land-bg-hero.png'), fullPage: false })

  await page.evaluate(() => {
    document.querySelectorAll('.mona-land__dots button')[9]?.click()
  })
  await new Promise((r) => setTimeout(r, 1800))
  const cta = await page.evaluate(() => {
    const bgs = [...document.querySelectorAll('.mona-land__bg')].map((img) => Number(getComputedStyle(img).opacity))
    return {
      num: document.querySelector('.mona-land__card.is-on .mona-land__num')?.textContent,
      opacities: bgs,
    }
  })
  await page.screenshot({ path: path.join(out, 'land-bg-cta.png'), fullPage: false })

  console.log(JSON.stringify({ hero, cta, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
