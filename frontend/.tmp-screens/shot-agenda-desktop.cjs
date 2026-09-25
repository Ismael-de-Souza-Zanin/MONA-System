const puppeteer = require('puppeteer-core')
const path = require('path')

async function main() {
  const edge =
    process.env.EDGE_PATH ||
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  const browser = await puppeteer.launch({
    executablePath: edge,
    headless: true,
    args: ['--hide-scrollbars'],
    defaultViewport: { width: 1280, height: 800 },
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0', timeout: 30000 })
  await page.click('button[type="submit"]')
  await page.waitForSelector('.mona-workspace', { timeout: 20000 })
  await page.goto('http://localhost:5173/agenda', { waitUntil: 'networkidle0', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 600))
  const info = await page.evaluate(() => {
    const mobile = document.querySelector('.mona-mobile-only')
    const desk = document.querySelector('.mona-desktop-only')
    return {
      isMobileShell: document.querySelector('.mona-shell')?.classList.contains('is-mobile') ?? null,
      mobileDisplay: mobile ? getComputedStyle(mobile).display : null,
      desktopDisplay: desk ? getComputedStyle(desk).display : null,
      header: desk?.querySelector('h1, h2')?.textContent || null,
      filters: [...(desk?.querySelectorAll('button') ?? [])].slice(0, 4).map((el) => el.textContent?.trim()),
      cards: desk?.querySelectorAll('.border-l-4').length ?? 0,
    }
  })
  await page.screenshot({
    path: path.join(__dirname, 'agenda-desktop.png'),
    fullPage: false,
  })
  console.log(JSON.stringify(info, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
