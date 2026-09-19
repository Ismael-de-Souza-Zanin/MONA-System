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
  await page.evaluate(() => localStorage.removeItem('mona_appearance_v1'))
  await page.reload({ waitUntil: 'networkidle0' })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 700))
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })

  const fan = await page.$('.mona-fan button')
  if (fan) {
    await fan.click()
    await new Promise((r) => setTimeout(r, 500))
    await page.screenshot({ path: path.join(out, 'defaults-mobile-fan.png'), fullPage: false })
  }

  await page.setViewport({ width: 1440, height: 900, isMobile: false })
  await page.goto('http://localhost:5173/configuracoes', { waitUntil: 'networkidle0', timeout: 30000 })
  const chromeTab = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((el) => el.textContent?.includes('Interface'))
    btn?.click()
    return Boolean(btn)
  })
  await new Promise((r) => setTimeout(r, 500))
  const sliders = await page.evaluate(() =>
    [...document.querySelectorAll('input[type="range"]')].map((el) => ({
      name: el.closest('label, .mona-field')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 40),
      value: el.value,
    })),
  )
  await page.screenshot({ path: path.join(out, 'defaults-settings.png'), fullPage: false })

  await page.goto('http://localhost:5173/todos', { waitUntil: 'networkidle0', timeout: 30000 })
  const box = await page.$('.mona-checklist input[type="checkbox"]:not(:checked)')
  if (box) {
    await box.click()
    await new Promise((r) => setTimeout(r, 450))
  }
  await page.screenshot({ path: path.join(out, 'defaults-todos-check.png'), fullPage: false })

  const chat = await page.evaluate(() => {
    const fab = document.querySelector('.mona-chat-fab')
    const dock = document.querySelector('.mona-sidebar')
    if (!fab || !dock) return null
    const a = fab.getBoundingClientRect()
    const b = dock.getBoundingClientRect()
    return { fabBottom: Math.round(window.innerHeight - a.bottom), dockTop: Math.round(b.top), overlap: a.bottom > b.top }
  })

  console.log(JSON.stringify({ chromeTab, sliders, chat, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
