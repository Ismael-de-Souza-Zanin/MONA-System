export type ThemeMode = 'light' | 'dark'

export type AppearancePresetId =
  | 'fatto-light'
  | 'fatto-dark'
  | 'studio-sand'
  | 'mona-ink'
  | 'ocean'
  | 'high-contrast'
  | 'custom'

export type TabStyle = 'pill' | 'underline' | 'chip'
export type WindowRadius = 'sm' | 'md' | 'lg'
export type WindowShadow = 'soft' | 'strong'
export type TypeScale = 0.9 | 1 | 1.1 | 1.2

export interface AppearanceColors {
  accent: string
  bg: string
  surface: string
  ink: string
  muted: string
  border: string
}

export interface AppearanceType {
  uiFont: string
  displayFont: string
  scale: TypeScale
  titleSize: number
  subtitleSize: number
  bodySize: number
  labelSize: number
  sidebarSize: number
  tabSize: number
}

export interface AppearanceChrome {
  sidebarBg: string
  sidebarInk: string
  sidebarActiveBg: string
  sidebarActiveInk: string
  tabStyle: TabStyle
  tabIcons: boolean
  tabActiveBg: string
  tabActiveInk: string
  windowRadius: WindowRadius
  windowShadow: WindowShadow
  notchSize: number
  notchDepth: number
  notchScoop: number
  notchPop: number
  notchCircle: number
  notchShadow: number
}

export interface AppearancePrefs {
  preset: AppearancePresetId
  mode: ThemeMode
  colors: AppearanceColors
  type: AppearanceType
  chrome: AppearanceChrome
}

export type AppearanceStage = 'presets' | 'palette' | 'type' | 'chrome'
