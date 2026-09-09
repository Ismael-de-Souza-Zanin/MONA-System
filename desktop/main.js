const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

const isDev = !app.isPackaged
const DEV_URL = process.env.FATTO_DEV_URL || 'http://localhost:5173'

function resolveAppIcon() {
  const candidates = [
    path.join(__dirname, 'build', 'icon.png'),
    path.join(__dirname, 'renderer', 'logo.png'),
    path.join(__dirname, 'renderer', 'favicon.png'),
  ]
  for (const p of candidates) {
    try {
      if (require('fs').existsSync(p)) return p
    } catch {
      /* ignore */
    }
  }
  return undefined
}

function createWindow() {
  const icon = resolveAppIcon()
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'FattoVirtual',
    ...(icon ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) {
    void win.loadURL(DEV_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    void win.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
