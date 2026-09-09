export type FattoDesktopBridge = {
  isDesktop: boolean
  platform?: string
}

declare global {
  interface Window {
    fattoDesktop?: FattoDesktopBridge
  }
}

export function isDesktopApp(): boolean {
  return !!window.fattoDesktop?.isDesktop || import.meta.env.VITE_DESKTOP === '1'
}
