const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('fattoDesktop', {
  isDesktop: true,
  platform: process.platform,
})
