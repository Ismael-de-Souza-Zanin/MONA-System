const puppeteer = require('puppeteer-core')

async function main() {
  const edge =
    process.env.EDGE_PATH ||
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  const browser = await puppeteer.launch({
    executablePath: edge,
    headless: true,
    args: ['--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => localStorage.setItem('fatto_sidebar_collapsed', '1'))
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-hero--stage', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 600))
  const info = await page.evaluate(() => {
    const hero = document.querySelector('.mona-hero--stage')
    const card = document.querySelector('.mona-hero__card')
    const stack = document.querySelector('.mona-dock__stack')
    const hs = hero ? getComputedStyle(hero) : null
    const cs = card ? getComputedStyle(card) : null
    const ss = stack ? getComputedStyle(stack) : null
    const cards = [...document.querySelectorAll('.mona-stack__card')].map((el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return {
        tag: el.tagName,
        className: el.className,
        top: Math.round(r.top),
        height: Math.round(r.height),
        marginTop: s.marginTop,
        parent: el.parentElement?.className,
      }
    })
    return {
      hero: hs && {
        minHeight: hs.minHeight,
        height: hs.height,
        padding: hs.padding,
        position: hs.position,
      },
      card: cs && {
        position: cs.position,
        bottom: cs.bottom,
        right: cs.right,
        width: cs.width,
      },
      stack: ss && {
        display: ss.display,
        flexDirection: ss.flexDirection,
        justifyContent: ss.justifyContent,
      },
      cards,
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
