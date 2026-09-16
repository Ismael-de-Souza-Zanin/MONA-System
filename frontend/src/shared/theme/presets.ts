import type { AppearanceChrome, AppearanceColors, AppearancePrefs, AppearanceType } from './types'

const fattoLightColors: AppearanceColors = {
  accent: '#006d69',
  bg: '#f0f5f4',
  surface: '#ffffff',
  ink: '#12212b',
  muted: '#64748b',
  border: '#e6ebef',
}

const fattoLightType: AppearanceType = {
  uiFont: 'dm-sans',
  displayFont: 'fraunces',
  scale: 1,
  titleSize: 1.5,
  subtitleSize: 0.875,
  bodySize: 0.875,
  labelSize: 0.875,
  sidebarSize: 0.875,
  tabSize: 0.75,
}

const fattoLightChrome: AppearanceChrome = {
  sidebarBg: '#ffffff',
  sidebarInk: '#334155',
  sidebarActiveBg: '#006d69',
  sidebarActiveInk: '#ffffff',
  tabStyle: 'pill',
  tabIcons: true,
  tabActiveBg: '#ffffff',
  tabActiveInk: '#004f4c',
  windowRadius: 'lg',
  windowShadow: 'soft',
}

export const PRESET_META: {
  id: Exclude<AppearancePrefs['preset'], 'custom'>
  name: string
  blurb: string
  mode: AppearancePrefs['mode']
}[] = [
  { id: 'fatto-light', name: 'Fatto claro', blurb: 'Verde da casa, operação diurna.', mode: 'light' },
  { id: 'fatto-dark', name: 'Fatto escuro', blurb: 'Os mesmos verdes, à noite.', mode: 'dark' },
  { id: 'studio-sand', name: 'Studio areia', blurb: 'Quente, editorial, menos clínico.', mode: 'light' },
  { id: 'mona-ink', name: 'MONA tinta', blurb: 'Noite profunda com ouro.', mode: 'dark' },
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
          accent: '#2ab0a7',
          bg: '#0a1514',
          surface: '#122422',
          ink: '#e8f6f4',
          muted: '#8ab5af',
          border: '#1e3a36',
        },
        type: { ...fattoLightType },
        chrome: {
          sidebarBg: '#122422',
          sidebarInk: '#c5e0dc',
          sidebarActiveBg: '#2ab0a7',
          sidebarActiveInk: '#041412',
          tabStyle: 'pill',
          tabIcons: true,
          tabActiveBg: '#122422',
          tabActiveInk: '#5fd4cb',
          windowRadius: 'lg',
          windowShadow: 'strong',
        },
      }
    case 'studio-sand':
      return {
        preset: id,
        mode: 'light',
        colors: {
          accent: '#9a4b2e',
          bg: '#f6f1ea',
          surface: '#fffdf9',
          ink: '#2c2118',
          muted: '#7a6a5c',
          border: '#e8ddd0',
        },
        type: { ...fattoLightType, uiFont: 'nunito', displayFont: 'fraunces' },
        chrome: {
          sidebarBg: '#fffdf9',
          sidebarInk: '#5c4a3c',
          sidebarActiveBg: '#9a4b2e',
          sidebarActiveInk: '#fffdf9',
          tabStyle: 'chip',
          tabIcons: true,
          tabActiveBg: '#fffdf9',
          tabActiveInk: '#9a4b2e',
          windowRadius: 'md',
          windowShadow: 'soft',
        },
      }
    case 'mona-ink':
      return {
        preset: id,
        mode: 'dark',
        colors: {
          accent: '#c9a227',
          bg: '#12141a',
          surface: '#1c1f28',
          ink: '#f3efe4',
          muted: '#9a9386',
          border: '#2a2e3a',
        },
        type: { ...fattoLightType, uiFont: 'outfit', displayFont: 'playfair' },
        chrome: {
          sidebarBg: '#1c1f28',
          sidebarInk: '#d8d2c4',
          sidebarActiveBg: '#c9a227',
          sidebarActiveInk: '#12141a',
          tabStyle: 'pill',
          tabIcons: true,
          tabActiveBg: '#1c1f28',
          tabActiveInk: '#e6c96a',
          windowRadius: 'md',
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
        type: { ...fattoLightType, uiFont: 'source-sans', displayFont: 'fraunces' },
        chrome: {
          sidebarBg: '#ffffff',
          sidebarInk: '#3d5560',
          sidebarActiveBg: '#0e7490',
          sidebarActiveInk: '#ffffff',
          tabStyle: 'underline',
          tabIcons: true,
          tabActiveBg: '#f0f6f8',
          tabActiveInk: '#0e7490',
          windowRadius: 'md',
          windowShadow: 'soft',
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
        type: { ...fattoLightType, uiFont: 'inter', displayFont: 'inter', scale: 1.1 },
        chrome: {
          sidebarBg: '#ffffff',
          sidebarInk: '#111111',
          sidebarActiveBg: '#111111',
          sidebarActiveInk: '#ffffff',
          tabStyle: 'underline',
          tabIcons: true,
          tabActiveBg: '#ffffff',
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
        colors: { ...fattoLightColors },
        type: { ...fattoLightType },
        chrome: { ...fattoLightChrome },
      }
  }
}

export function defaultAppearance(mode: AppearancePrefs['mode'] = 'light'): AppearancePrefs {
  return presetPrefs(mode === 'dark' ? 'fatto-dark' : 'fatto-light')
}

export function markCustom(prefs: AppearancePrefs): AppearancePrefs {
  return { ...prefs, preset: 'custom' }
}
