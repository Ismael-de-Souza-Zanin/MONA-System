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

  for (const route of ['/', '/todos', '/agenda', '/clientes']) {
    await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle0', timeout: 20000 })
  }
  await new Promise((r) => setTimeout(r, 400))

  const closed = await page.evaluate(() => {
    const folder = document.querySelector('.mona-tabbar__folder')
    const strip = document.querySelector('.mona-tabbar.is-compact .mona-tabbar__strip')
    const iconTabs = document.querySelectorAll('.mona-tab.is-icon')
    const popup = document.querySelector('.mona-tablist')
    return {
      path: location.pathname,
      hasFolder: Boolean(folder),
      folderCount: folder?.querySelector('span')?.textContent || null,
      hasStrip: Boolean(strip),
      iconTabs: iconTabs.length,
      popupOpen: Boolean(popup),
    }
  })
  await page.screenshot({ path: path.join(out, 'folder-closed.png'), fullPage: false })

  await page.click('.mona-tabbar__folder')
  await page.waitForSelector('.mona-tablist', { timeout: 5000 })
  await new Promise((r) => setTimeout(r, 250))
  const opened = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.mona-tablist__open')].map((el) => el.textContent?.trim())
    return {
      popupOpen: Boolean(document.querySelector('.mona-tablist')),
      title: document.querySelector('.mona-tablist__title')?.textContent || null,
      rows,
    }
  })
  await page.screenshot({ path: path.join(out, 'folder-open.png'), fullPage: false })

  const target = await page.$('.mona-tablist__open')
  if (target) {
    await target.evaluate((el) => el.click())
    await new Promise((r) => setTimeout(r, 400))
  }
  const after = await page.evaluate(() => ({
    path: location.pathname,
    popupOpen: Boolean(document.querySelector('.mona-tablist')),
  }))

  await page.setViewport({ width: 1280, height: 800 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 400))
  const desktop = await page.evaluate(() => ({
    folder: Boolean(document.querySelector('.mona-tabbar__folder')),
    tabs: document.querySelectorAll('.mona-tabbar:not(.is-compact) .mona-tab').length,
    titles: [...document.querySelectorAll('.mona-tabbar:not(.is-compact) .mona-tab button')].slice(0, 6).map((el) =>
      el.textContent?.trim(),
    ),
  }))

  console.log(JSON.stringify({ closed, opened, after, desktop, errors }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
