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
  await page.waitForSelector('.mona-land__dots button', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 2200))

  const jump = async (ratio, file) => {
    await page.evaluate((r) => {
      const pin = document.querySelector('.mona-land__pin')
      if (!pin) return
      const max = pin.offsetHeight - window.innerHeight
      window.scrollTo(0, pin.offsetTop + max * r)
    }, ratio)
    await new Promise((r) => setTimeout(r, 1400))
    const info = await page.evaluate(() => ({
      num: document.querySelector('.mona-land__card.is-on .mona-land__num')?.textContent,
      land: document.querySelector('.mona-land')?.style.getPropertyValue('--land'),
    }))
    await page.screenshot({ path: path.join(out, file), fullPage: false })
    return info
  }

  const shots = []
  shots.push(await jump(4 / 9 - 0.035, 'land-s05a.png'))
  shots.push(await jump(4 / 9, 'land-s05b.png'))
  shots.push(await jump(4 / 9 + 0.04, 'land-s05c.png'))
  shots.push(await jump(6 / 9, 'land-s07.png'))
  shots.push(await jump(7 / 9 - 0.03, 'land-s08a.png'))
  shots.push(await jump(7 / 9 + 0.03, 'land-s08b.png'))

  console.log(JSON.stringify({ shots, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
