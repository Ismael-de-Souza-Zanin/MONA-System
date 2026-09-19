import type { AppearanceChrome, AppearanceColors, AppearancePrefs, AppearanceType } from './types'

const monaLightColors: AppearanceColors = {
  accent: '#7b5cff',
  bg: '#f6ebe6',
  surface: '#ffffff',
  ink: '#0f0a1a',
  muted: '#7a6170',
  border: '#f0ddd4',
}

const monaLightType: AppearanceType = {
  uiFont: 'nunito',
  displayFont: 'outfit',
  scale: 1,
  titleSize: 1.5,
  subtitleSize: 0.875,
  bodySize: 0.875,
  labelSize: 0.875,
  sidebarSize: 0.875,
  tabSize: 0.75,
}

export const defaultNotchChrome = {
  notchSize: 64,
  notchDepth: 59,
  notchScoop: 19,
  notchPop: 11,
  notchCircle: 39,
  notchShadow: 12,
}

const monaLightChrome: AppearanceChrome = {
  sidebarBg: '#ffffff',
  sidebarInk: '#0f0a1a',
  sidebarActiveBg: '#ff4fd8',
  sidebarActiveInk: '#ffffff',
  tabStyle: 'pill',
  tabIcons: true,
  tabActiveBg: '#ffffff',
  tabActiveInk: '#7b5cff',
  windowRadius: 'lg',
  windowShadow: 'soft',
  ...defaultNotchChrome,
}

export const PRESET_META: {
  id: Exclude<AppearancePrefs['preset'], 'custom'>
  name: string
  blurb: string
  mode: AppearancePrefs['mode']
}[] = [
  { id: 'fatto-light', name: 'MONA claro', blurb: 'Sunset da marca: violeta, magenta, coral e laranja.', mode: 'light' },
  { id: 'fatto-dark', name: 'MONA escuro', blurb: 'Base profunda com neon da marca.', mode: 'dark' },
  { id: 'studio-sand', name: 'Studio areia', blurb: 'Quente, editorial, menos clínico.', mode: 'light' },
  { id: 'mona-ink', name: 'MONA tinta', blurb: 'Noite com o gradiente da marca.', mode: 'dark' },
  { id: 'ocean', name: 'Oceano', blurb: 'Ardósia e azul de trabalho longo.', mode: 'light' },
  { id: 'high-contrast', name: 'Alto contraste', blurb: 'Máxima leitura, bordas firmes.', mode: 'light' },
]

export function presetPrefs(id: Exclude<AppearancePrefs['preset'], 'custom'>): AppearancePrefs {
  switch (id) {
    case 'fatto-dark':
      return {
        preset: id,
        mode: 'dark',
        colors: {
          accent: '#8f74ff',
          bg: '#0f0a1a',
          surface: '#1a142c',
          ink: '#f6f1ff',
          muted: '#9b90b8',
          border: '#2e2448',
        },
        type: { ...monaLightType },
        chrome: {
          ...monaLightChrome,
          sidebarBg: '#1a142c',
          sidebarInk: '#d8cff0',
          sidebarActiveBg: '#ff4fd8',
          sidebarActiveInk: '#ffffff',
          tabActiveBg: '#1a142c',
          tabActiveInk: '#c4b5ff',
          windowShadow: 'strong',
        },
      }
    case 'studio-sand':
      return {
        preset: id,
        mode: 'light',
        colors: {
          accent: '#ff5b7a',
          bg: '#f6f1ea',
          surface: '#fffdf9',
          ink: '#2c2118',
          muted: '#7a6a5c',
          border: '#e8ddd0',
        },
        type: { ...monaLightType, uiFont: 'nunito', displayFont: 'outfit' },
        chrome: {
          ...monaLightChrome,
          sidebarBg: '#fffdf9',
          sidebarInk: '#5c4a3c',
          sidebarActiveBg: '#ff5b7a',
          sidebarActiveInk: '#fffdf9',
          tabActiveBg: '#fffdf9',
          tabActiveInk: '#ff5b7a',
          windowRadius: 'md',
        },
      }
    case 'mona-ink':
      return {
        preset: id,
        mode: 'dark',
        colors: {
          accent: '#ff4fd8',
          bg: '#0f0a1a',
          surface: '#161022',
          ink: '#f6f1ff',
          muted: '#9b90b8',
          border: '#2a2240',
        },
        type: { ...monaLightType, uiFont: 'outfit', displayFont: 'outfit' },
        chrome: {
          ...monaLightChrome,
          sidebarBg: '#161022',
          sidebarInk: '#d8cff0',
          sidebarActiveBg: '#ff4fd8',
          sidebarActiveInk: '#ffffff',
          tabActiveBg: '#161022',
          tabActiveInk: '#ff9a2e',
          windowShadow: 'strong',
        },
      }
    case 'ocean':
      return {
        preset: id,
        mode: 'light',
        colors: {
          accent: '#0e7490',
          bg: '#f0f6f8',
          surface: '#ffffff',
          ink: '#0f2430',
          muted: '#5b7380',
          border: '#d5e2e8',
        },
        type: { ...monaLightType, uiFont: 'source-sans', displayFont: 'outfit' },
        chrome: {
          ...monaLightChrome,
          sidebarBg: '#ffffff',
          sidebarInk: '#3d5560',
          sidebarActiveBg: '#0e7490',
          sidebarActiveInk: '#ffffff',
          tabActiveBg: '#f0f6f8',
          tabActiveInk: '#0e7490',
          windowRadius: 'md',
        },
      }
    case 'high-contrast':
      return {
        preset: id,
        mode: 'light',
        colors: {
          accent: '#111111',
          bg: '#ffffff',
          surface: '#ffffff',
          ink: '#111111',
          muted: '#333333',
          border: '#111111',
        },
        type: { ...monaLightType, uiFont: 'inter', displayFont: 'inter', scale: 1.1 },
        chrome: {
          ...monaLightChrome,
          sidebarBg: '#ffffff',
          sidebarInk: '#111111',
          sidebarActiveBg: '#111111',
          sidebarActiveInk: '#ffffff',
          tabActiveInk: '#111111',
          windowRadius: 'sm',
          windowShadow: 'strong',
        },
      }
    case 'fatto-light':
    default:
      return {
        preset: 'fatto-light',
        mode: 'light',
        colors: { ...monaLightColors },
        type: { ...monaLightType },
        chrome: { ...monaLightChrome },
      }
  }
}

export function hydrateAppearance(prefs: AppearancePrefs): AppearancePrefs {
  const chrome = { ...monaLightChrome, ...prefs.chrome }
  const factoryNotch =
    (chrome.notchSize === 100 && chrome.notchDepth === 65) ||
    (chrome.notchSize === 78 && chrome.notchDepth === 52) ||
    chrome.notchCircle === 46 ||
    (chrome.notchSize === 100 && chrome.notchCircle === 40)
  if (factoryNotch) Object.assign(chrome, defaultNotchChrome)
  if (chrome.sidebarBg === '#d9c6ff' || chrome.sidebarBg === '#f3e7ff') {
    chrome.sidebarBg = '#ffffff'
    if (chrome.sidebarInk === '#3d2740') chrome.sidebarInk = '#0f0a1a'
  }
  if (chrome.tabStyle === 'underline' || chrome.tabStyle === 'chip') {
    if (prefs.preset !== 'custom') chrome.tabStyle = 'pill'
  }
  return {
    ...prefs,
    colors: { ...monaLightColors, ...prefs.colors },
    type: { ...monaLightType, ...prefs.type },
    chrome,
  }
}

export function defaultAppearance(mode: AppearancePrefs['mode'] = 'light'): AppearancePrefs {
  return presetPrefs(mode === 'dark' ? 'fatto-dark' : 'fatto-light')
}

export function markCustom(prefs: AppearancePrefs): AppearancePrefs {
  return { ...prefs, preset: 'custom' }
}
