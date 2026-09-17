const puppeteer = require('puppeteer-core')

const browser = await puppeteer.launch({
  executablePath: process.env.EDGE_PATH,
  headless: true,
  args: ['--window-size=1440,900', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0', timeout: 30000 })
await page.waitForSelector('button[type="submit"]', { timeout: 15000 })
await page.click('button[type="submit"]')
await page.waitForSelector('.mona-sidebar', { timeout: 20000 })
await new Promise((r) => setTimeout(r, 900))

const sidebar = await page.$('.mona-sidebar')
await sidebar.screenshot({ path: process.env.OUT + '/notch-compact.png' })
await page.screenshot({ path: process.env.OUT + '/notch-app.png' })

const link = await page.$('a[href="/clientes"]')
if (link) {
  await link.click()
  await new Promise((r) => setTimeout(r, 700))
  await sidebar.screenshot({ path: process.env.OUT + '/notch-clientes.png' })
}

const vars = await page.$eval('.mona-sidebar', (el) => {
  const s = getComputedStyle(el)
  const skin = el.querySelector('.mona-sidebar__skin')
  const cs = skin ? getComputedStyle(skin) : null
  return {
    x: s.getPropertyValue('--mona-notch-x'),
    y: s.getPropertyValue('--mona-notch-y'),
    mask: cs?.webkitMaskImage?.slice(0, 180) || cs?.maskImage?.slice(0, 180),
    maskComposite: cs?.maskComposite || cs?.webkitMaskComposite,
    width: el.getBoundingClientRect().width,
  }
})
console.log(JSON.stringify(vars, null, 2))
await browser.close()
