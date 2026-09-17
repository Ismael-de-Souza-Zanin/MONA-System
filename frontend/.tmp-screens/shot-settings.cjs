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
  args: ['--window-size=1440,900', '--hide-scrollbars'],
  defaultViewport: { width: 1440, height: 900 },
})
const page = await browser.newPage()
await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0', timeout: 30000 })
await page.evaluate(() => localStorage.setItem('fatto_sidebar_collapsed', '1'))
await page.click('button[type="submit"]')
await page.waitForSelector('.mona-sidebar.is-compact', { timeout: 20000 })
await page.goto('http://localhost:5174/configuracoes', { waitUntil: 'networkidle0', timeout: 30000 })
await page.waitForSelector('a[href="/configuracoes"].is-active', { timeout: 15000 })
await new Promise((r) => setTimeout(r, 800))

const sidebar = await page.$('.mona-sidebar')
await sidebar.screenshot({ path: path.join(out, 'settings-fix.png') })

const metrics = await page.evaluate(() => {
  const host = document.querySelector('.mona-sidebar')
  const item = document.querySelector('a[href="/configuracoes"]')
  const inner = item?.querySelector('.mona-sidebar__link-inner')
  const hs = getComputedStyle(host)
  const hostRect = host.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  const innerRect = inner.getBoundingClientRect()
  const y = parseFloat(hs.getPropertyValue('--mona-notch-y'))
  const size = parseFloat(hs.getPropertyValue('--mona-notch-size'))
  const scoop = parseFloat(hs.getPropertyValue('--mona-notch-scoop'))
  const notchCenter = hostRect.top + y + scoop + size / 2
  const icons = [...host.querySelectorAll('.mona-sidebar__compact .mona-sidebar__link-inner')].map((el) => {
    const r = el.getBoundingClientRect()
    return {
      top: Math.round(r.top - hostRect.top),
      bottom: Math.round(hostRect.bottom - r.bottom),
      outside: r.top < hostRect.top - 1 || r.bottom > hostRect.bottom + 1,
    }
  })
  return {
    y,
    size,
    scoop,
    hostH: hostRect.height,
    itemCenter: itemRect.top + itemRect.height / 2,
    innerCenter: innerRect.top + innerRect.height / 2,
    notchCenter,
    delta: Math.round(innerRect.top + innerRect.height / 2 - notchCenter),
    dockPad: getComputedStyle(document.querySelector('[data-sidebar-dock]')).paddingBottom,
    itemBottomFromHost: hostRect.bottom - itemRect.bottom,
    icons,
    anyOutside: icons.some((i) => i.outside),
  }
})
console.log('compact-settings', JSON.stringify(metrics, null, 2))

const settingsState = await page.evaluate(() => {
  const settings = document.querySelector('a[href="/configuracoes"]')
  const fan = document.querySelector('.mona-fan.is-open')
  return {
    settingsNotch: settings?.classList.contains('is-notch-item'),
    settingsActive: settings?.classList.contains('is-active'),
    fanOpen: Boolean(fan),
  }
})
console.log('settings-idle', JSON.stringify(settingsState))

await page.click('button[aria-label="Financeiro"]')
await new Promise((r) => setTimeout(r, 500))
await sidebar.screenshot({ path: path.join(out, 'settings-fan.png') })
const fanState = await page.evaluate(() => {
  const settings = document.querySelector('a[href="/configuracoes"]')
  const fanBtn = document.querySelector('.mona-fan.is-open .mona-sidebar__link')
  const inner = settings?.querySelector('.mona-sidebar__link-inner')
  const cs = inner ? getComputedStyle(inner) : null
  return {
    settingsNotch: settings?.classList.contains('is-notch-item'),
    fanNotch: fanBtn?.classList.contains('is-notch-item'),
    settingsTransform: cs?.transform,
    settingsBg: cs?.backgroundColor,
  }
})
console.log('settings-fan', JSON.stringify(fanState, null, 2))

await page.click('button[aria-label="Financeiro"]')
await new Promise((r) => setTimeout(r, 400))

await page.click('a[href="/"]')
await new Promise((r) => setTimeout(r, 700))
await sidebar.screenshot({ path: path.join(out, 'settings-dash.png') })
const dash = await page.evaluate(() => ({
  dockPad: getComputedStyle(document.querySelector('[data-sidebar-dock]')).paddingBottom,
  settingsActive: document.querySelector('a[href="/configuracoes"]')?.classList.contains('is-active'),
}))
console.log('compact-dash', JSON.stringify(dash, null, 2))

await page.setViewport({ width: 1440, height: 720 })
await new Promise((r) => setTimeout(r, 500))
await sidebar.screenshot({ path: path.join(out, 'settings-dash-short.png') })
const short = await page.evaluate(() => {
  const host = document.querySelector('.mona-sidebar')
  const hostRect = host.getBoundingClientRect()
  const icons = [...host.querySelectorAll('.mona-sidebar__compact .mona-sidebar__link-inner')]
  return {
    hostH: hostRect.height,
    anyOutside: icons.some((el) => {
      const r = el.getBoundingClientRect()
      return r.top < hostRect.top - 1 || r.bottom > hostRect.bottom + 1
    }),
    lastBottom: Math.round(hostRect.bottom - icons.at(-1).getBoundingClientRect().bottom),
  }
})
console.log('compact-short', JSON.stringify(short, null, 2))

await page.setViewport({ width: 1440, height: 900 })
await page.click('button[aria-label="Expandir menu"]')
await new Promise((r) => setTimeout(r, 500))
await page.click('a[href="/operacao"]')
await new Promise((r) => setTimeout(r, 800))
const sidebarFull = await page.$('.mona-sidebar')
await sidebarFull.screenshot({ path: path.join(out, 'settings-full.png') })
const full = await page.evaluate(() => {
  const host = document.querySelector('.mona-sidebar')
  const item = document.querySelector('a[href="/operacao"]')
  const inner = item?.querySelector('.mona-sidebar__link-inner')
  const hs = getComputedStyle(host)
  const hostRect = host.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  const innerRect = inner.getBoundingClientRect()
  const y = parseFloat(hs.getPropertyValue('--mona-notch-y'))
  const mask = hs.getPropertyValue('--mona-notch-mask-size')
  return {
    compact: host.classList.contains('is-compact'),
    y,
    mask,
    itemH: itemRect.height,
    innerCenter: innerRect.top + innerRect.height / 2 - hostRect.top,
  }
})
console.log('full-operacao', JSON.stringify(full, null, 2))

await page.goto('http://localhost:5174/whatsapp', { waitUntil: 'networkidle0', timeout: 30000 })
await new Promise((r) => setTimeout(r, 700))
await page.screenshot({ path: path.join(out, 'canvas-align.png') })
const layout = await page.evaluate(() => {
  const shell = document.querySelector('.mona-shell')
  const side = document.querySelector('.mona-sidebar')
  const canvas = document.querySelector('.mona-canvas')
  const main = document.querySelector('.mona-canvas__main')
  const sr = side.getBoundingClientRect()
  const cr = canvas.getBoundingClientRect()
  return {
    pageScroll: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    bodyScroll: document.body.scrollHeight - document.body.clientHeight,
    shellH: shell.getBoundingClientRect().height,
    sideTop: Math.round(sr.top),
    sideBottom: Math.round(sr.bottom),
    canvasTop: Math.round(cr.top),
    canvasBottom: Math.round(cr.bottom),
    alignTop: Math.round(sr.top) === Math.round(cr.top),
    alignBottom: Math.abs(sr.bottom - cr.bottom) <= 1,
    mainScrollable: main.scrollHeight > main.clientHeight + 4,
    mainOverflow: getComputedStyle(main).overflowY,
  }
})
await page.$eval('.mona-canvas__main', (el) => {
  el.scrollTop = 180
})
await new Promise((r) => setTimeout(r, 300))
await page.screenshot({ path: path.join(out, 'canvas-scrolled.png') })
const after = await page.evaluate(() => ({
  pageY: window.scrollY,
  mainY: document.querySelector('.mona-canvas__main').scrollTop,
  sideTop: Math.round(document.querySelector('.mona-sidebar').getBoundingClientRect().top),
  canvasTop: Math.round(document.querySelector('.mona-canvas').getBoundingClientRect().top),
}))
console.log('canvas-layout', JSON.stringify(layout, null, 2))
console.log('canvas-scrolled', JSON.stringify(after, null, 2))
await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
