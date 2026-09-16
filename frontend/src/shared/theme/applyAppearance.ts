import { ensureFont, fontById } from './fonts'
import type { AppearancePrefs } from './types'

const OVERRIDES = [
  '--fv-primary',
  '--fv-primary-hover',
  '--fv-bg',
  '--fv-surface',
  '--fv-border',
  '--fv-text',
  '--fv-muted',
  '--fv-brand-800',
  '--fv-brand-900',
  '--fv-brand-700',
  '--fv-brand-50',
  '--fv-brand-100',
  '--fv-ink-900',
  '--fv-ink-700',
  '--fv-ink-500',
  '--fv-ink-300',
  '--fv-ink-100',
  '--fv-ink-50',
  '--tenant-accent',
  '--tenant-accent-hover',
  '--tenant-accent-soft',
  '--mona-color-bg',
  '--mona-color-surface',
  '--mona-color-ink',
  '--mona-color-muted',
  '--mona-color-border',
  '--mona-color-accent',
  '--mona-color-accent-hover',
  '--mona-color-accent-soft',
  '--mona-color-accent-muted',
  '--mona-color-on-accent',
  '--mona-font-ui',
  '--mona-font-display',
  '--mona-type-scale',
  '--mona-type-title',
  '--mona-type-subtitle',
  '--mona-type-body',
  '--mona-type-label',
  '--mona-type-sidebar',
  '--mona-type-tab',
  '--mona-chrome-sidebar-bg',
  '--mona-chrome-sidebar-ink',
  '--mona-chrome-sidebar-border',
  '--mona-chrome-sidebar-active-bg',
  '--mona-chrome-sidebar-active-ink',
  '--mona-chrome-sidebar-hover-bg',
  '--mona-chrome-tab-active-bg',
  '--mona-chrome-tab-active-ink',
  '--mona-chrome-tab-ink',
  '--mona-chrome-window-bg',
  '--mona-chrome-window-title-bg',
  '--mona-chrome-window-radius',
  '--mona-chrome-window-shadow',
] as const

function setVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

function mix(a: string, b: string, pct: number) {
  return `color-mix(in srgb, ${a} ${pct}%, ${b})`
}

function rem(n: number) {
  return `${n}rem`
}

const RADIUS: Record<AppearancePrefs['chrome']['windowRadius'], string> = {
  sm: '8px',
  md: '14px',
  lg: '20px',
}

function windowShadow(kind: AppearancePrefs['chrome']['windowShadow'], ink: string) {
  if (kind === 'strong') {
    return `0 2px 6px ${mix(ink, 'transparent', 18)}, 0 18px 40px ${mix(ink, 'transparent', 22)}`
  }
  return `0 1px 2px ${mix(ink, 'transparent', 8)}, 0 10px 28px ${mix(ink, 'transparent', 10)}`
}

export function applyAppearance(prefs: AppearancePrefs) {
  const root = document.documentElement
  const { colors, type, chrome, mode } = prefs

  root.classList.toggle('dark', mode === 'dark')
  root.dataset.theme = mode
  root.dataset.tenant = 'fatto'
  root.dataset.tabStyle = chrome.tabStyle
  root.dataset.tabIcons = chrome.tabIcons ? 'on' : 'off'
  root.style.colorScheme = mode

  ensureFont(type.uiFont)
  ensureFont(type.displayFont)

  const ui = fontById(type.uiFont)?.css || '"DM Sans", system-ui, sans-serif'
  const display = fontById(type.displayFont)?.css || 'Fraunces, Georgia, serif'
  const onAccent = mode === 'dark' ? mix(colors.ink, colors.bg, 20) : '#ffffff'
  const hover = mix(colors.ink, colors.accent, 28)
  const soft = mix(colors.accent, colors.surface, 14)
  const mutedAccent = mix(colors.accent, colors.surface, 22)

  setVar('--fv-primary', colors.accent)
  setVar('--fv-primary-hover', hover)
  setVar('--fv-bg', colors.bg)
  setVar('--fv-surface', colors.surface)
  setVar('--fv-border', colors.border)
  setVar('--fv-text', colors.ink)
  setVar('--fv-muted', colors.muted)
  setVar('--fv-brand-800', colors.accent)
  setVar('--fv-brand-900', hover)
  setVar('--fv-brand-700', mix(colors.accent, colors.ink, 70))
  setVar('--fv-brand-50', soft)
  setVar('--fv-brand-100', mutedAccent)
  setVar('--fv-ink-900', colors.ink)
  setVar('--fv-ink-700', mix(colors.ink, colors.muted, 65))
  setVar('--fv-ink-500', colors.muted)
  setVar('--fv-ink-300', mix(colors.border, colors.muted, 55))
  setVar('--fv-ink-100', mix(colors.border, colors.surface, 70))
  setVar('--fv-ink-50', mix(colors.bg, colors.surface, 60))

  setVar('--tenant-accent', colors.accent)
  setVar('--tenant-accent-hover', hover)
  setVar('--tenant-accent-soft', soft)

  setVar('--mona-color-bg', colors.bg)
  setVar('--mona-color-surface', colors.surface)
  setVar('--mona-color-ink', colors.ink)
  setVar('--mona-color-muted', colors.muted)
  setVar('--mona-color-border', colors.border)
  setVar('--mona-color-accent', colors.accent)
  setVar('--mona-color-accent-hover', hover)
  setVar('--mona-color-accent-soft', soft)
  setVar('--mona-color-accent-muted', mutedAccent)
  setVar('--mona-color-on-accent', onAccent)

  setVar('--mona-font-ui', ui)
  setVar('--mona-font-display', display)
  setVar('--mona-type-scale', String(type.scale))
  setVar('--mona-type-title', rem(type.titleSize))
  setVar('--mona-type-subtitle', rem(type.subtitleSize))
  setVar('--mona-type-body', rem(type.bodySize))
  setVar('--mona-type-label', rem(type.labelSize))
  setVar('--mona-type-sidebar', rem(type.sidebarSize))
  setVar('--mona-type-tab', rem(type.tabSize))

  setVar('--mona-chrome-sidebar-bg', chrome.sidebarBg)
  setVar('--mona-chrome-sidebar-ink', chrome.sidebarInk)
  setVar('--mona-chrome-sidebar-border', colors.border)
  setVar('--mona-chrome-sidebar-active-bg', chrome.sidebarActiveBg)
  setVar('--mona-chrome-sidebar-active-ink', chrome.sidebarActiveInk)
  setVar('--mona-chrome-sidebar-hover-bg', mix(chrome.sidebarInk, chrome.sidebarBg, 8))
  setVar('--mona-chrome-tab-active-bg', chrome.tabActiveBg)
  setVar('--mona-chrome-tab-active-ink', chrome.tabActiveInk)
  setVar('--mona-chrome-tab-ink', colors.muted)
  setVar('--mona-chrome-window-bg', colors.surface)
  setVar('--mona-chrome-window-title-bg', mix(colors.bg, colors.surface, 70))
  setVar('--mona-chrome-window-radius', RADIUS[chrome.windowRadius])
  setVar('--mona-chrome-window-shadow', windowShadow(chrome.windowShadow, colors.ink))
}

export function clearAppearanceOverrides() {
  const style = document.documentElement.style
  for (const name of OVERRIDES) style.removeProperty(name)
}
