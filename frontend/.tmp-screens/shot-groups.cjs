const puppeteer = require('puppeteer-core')
const path = require('path')

async function main() {
  const out = path.resolve(__dirname)
  const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  const browser = await puppeteer.launch({
    executablePath: edge,
    headless: true,
    args: ['--window-size=1440,900', '--hide-scrollbars'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.evaluate(() => localStorage.setItem('fatto_sidebar_collapsed', '1'))
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-brand', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'brand-compact.png') })
  const layout = await page.evaluate(() => {
    const brand = document.querySelector('.mona-brand').getBoundingClientRect()
    const side = document.querySelector('.mona-sidebar').getBoundingClientRect()
    return {
      brandH: Math.round(brand.height),
      brandR: getComputedStyle(document.querySelector('.mona-brand')).borderRadius,
      gap: Math.round(side.top - brand.bottom),
      sameLeft: Math.round(brand.left) === Math.round(side.left),
    }
  })
  console.log('brand', JSON.stringify(layout))
  const sidebar = await page.$('.mona-sidebar')
  const hints = await page.evaluate(() =>
    [...document.querySelectorAll('.mona-fan')].map((fan, i) => {
      const items = document.querySelectorAll('.mona-fan__list')[i]?.querySelectorAll('.mona-fan__item')
      return {
        label: fan.querySelector('button')?.getAttribute('aria-label'),
        dots: items?.length ?? 0,
        firstSize: items?.[0] ? Math.round(items[0].getBoundingClientRect().width) : 0,
      }
    }),
  )
  console.log('closed', JSON.stringify(hints, null, 2))
  await sidebar.screenshot({ path: path.join(out, 'groups-compact.png') })

  await page.click('button[aria-label="Gestão, grupo com 5 itens"]')
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'groups-open.png') })
  const open = await page.evaluate(() => {
    const list = document.querySelector('.mona-fan__list.is-open')
    const item = list?.querySelector('.mona-fan__item')
    return {
      open: Boolean(list),
      size: item ? Math.round(item.getBoundingClientRect().width) : 0,
    }
  })
  console.log('open', JSON.stringify(open))

  await page.click('button[aria-label="Expandir menu"]')
  await new Promise((r) => setTimeout(r, 600))
  await sidebar.screenshot({ path: path.join(out, 'groups-full.png') })
  const counts = await page.evaluate(() =>
    [...document.querySelectorAll('.mona-sidebar__group-count')].map((el) => el.textContent),
  )
  console.log('counts', counts)
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
