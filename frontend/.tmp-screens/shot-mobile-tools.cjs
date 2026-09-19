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
  page.on('pageerror', (err) => console.log('PAGEERROR', err.message))
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-sidebar.is-mobile-dock', { timeout: 20000 })
  await new Promise((r) => setTimeout(r, 900))

  const info = await page.evaluate(() => {
    const tools = document.querySelector('.mona-topbar .mona-panel--tools')
    const profile = tools?.querySelector('button[aria-haspopup="menu"]')
    const theme = tools?.querySelector('[aria-label*="Tema"]')
    const dock = document.querySelector('.mona-sidebar')
    const active = document.querySelector('.mona-sidebar .is-notch-item')
    const plus = document.querySelector('.mona-sidebar__cta-slot .mona-sidebar__link')
    const tr = tools?.getBoundingClientRect()
    const pr = profile?.getBoundingClientRect()
    const thr = theme?.getBoundingClientRect()
    const dr = dock?.getBoundingClientRect()
    const ar = active?.getBoundingClientRect()
    const ir = active?.querySelector('.mona-sidebar__link-inner')?.getBoundingClientRect()
    const xr = plus?.getBoundingClientRect()
    const notchX = dock ? getComputedStyle(dock).getPropertyValue('--mona-notch-x').trim() : null
    return {
      toolsVisible: Boolean(tools),
      themeVisible: Boolean(theme),
      themeRight: thr ? Math.round(thr.right) : null,
      profileRight: pr ? Math.round(pr.right) : null,
      toolsTop: tr ? Math.round(tr.top) : null,
      toolsRight: tr ? Math.round(tr.right) : null,
      toolsCut: tr ? tr.right > window.innerWidth + 2 || tr.top < 0 || tr.bottom > window.innerHeight : null,
      vw: window.innerWidth,
      dockLeft: dr ? Math.round(dr.left) : null,
      dockRight: dr ? Math.round(dr.right) : null,
      dockFull: dr ? Math.round(dr.left) === 0 && Math.round(dr.right) === window.innerWidth : null,
      activeIsPlus: Boolean(active && plus && active === plus),
      activeCenter: ir ? Math.round(ir.left + ir.width / 2) : ar ? Math.round(ar.left + ar.width / 2) : null,
      plusCenter: xr ? Math.round(xr.left + xr.width / 2) : null,
      notchX,
      hasNotch: dock?.classList.contains('has-notch') ?? false,
      mask: dock ? getComputedStyle(dock, '::before').webkitMaskImage?.slice(0, 80) : null,
      itemCount: document.querySelectorAll('.mona-sidebar__compact > .mona-fan, .mona-sidebar__compact > [data-sidebar-dock], .mona-sidebar__cta-slot').length,
    }
  })
  await page.screenshot({ path: path.join(out, 'defaults-mobile.png'), fullPage: false })
  await page.screenshot({
    path: path.join(out, 'defaults-mobile-dock.png'),
    clip: { x: 0, y: 680, width: 390, height: 164 },
  })

  const themeBtn = await page.$('.mona-topbar [aria-label*="Tema"]')
  if (themeBtn) {
    await themeBtn.click()
    await new Promise((r) => setTimeout(r, 400))
    await page.screenshot({ path: path.join(out, 'defaults-mobile-theme.png'), fullPage: false })
  }

  const profileBtn = await page.$('.mona-topbar button[aria-haspopup="menu"]')
  if (profileBtn) {
    await profileBtn.click()
    await new Promise((r) => setTimeout(r, 400))
    const menuBox = await page.evaluate(() => {
      const menu = document.querySelector('[role="menu"]')
      const r = menu?.getBoundingClientRect()
      return r
        ? {
            visible: true,
            top: Math.round(r.top),
            right: Math.round(r.right),
            bottom: Math.round(r.bottom),
            cut: r.right > window.innerWidth + 2 || r.bottom > window.innerHeight + 2 || r.left < -2,
          }
        : { visible: false }
    })
    await page.screenshot({ path: path.join(out, 'defaults-mobile-profile.png'), fullPage: false })
    console.log('MENU', JSON.stringify(menuBox))
  }

  const agenda = await page.$('a[href="/agenda"]')
  if (agenda) {
    await page.click('[role="menu"] button, .mona-topbar button[aria-haspopup="menu"]')
  }
  await page.evaluate(() => {
    document.querySelector('[role="menu"]')?.remove()
  })
  const fan = await page.$('.mona-fan .mona-sidebar__link')
  if (fan) {
    await fan.click()
    await new Promise((r) => setTimeout(r, 350))
  }
  const agendaLink = await page.$('.mona-fan__list a[href="/agenda"]')
  if (agendaLink) {
    await agendaLink.click()
    await new Promise((r) => setTimeout(r, 700))
    const after = await page.evaluate(() => {
      const active = document.querySelector('.mona-sidebar .is-notch-item')
      const ir = active?.querySelector('.mona-sidebar__link-inner')?.getBoundingClientRect()
      const dock = document.querySelector('.mona-sidebar')
      return {
        path: location.pathname,
        activeCenter: ir ? Math.round(ir.left + ir.width / 2) : null,
        notchX: dock ? getComputedStyle(dock).getPropertyValue('--mona-notch-x').trim() : null,
      }
    })
    await page.screenshot({ path: path.join(out, 'defaults-mobile-agenda.png'), fullPage: false })
    console.log('AGENDA', JSON.stringify(after))
  }

  console.log('INFO', JSON.stringify(info, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
