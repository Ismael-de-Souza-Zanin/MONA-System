import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { applyAppearance } from './applyAppearance'
import { defaultAppearance, hydrateAppearance, markCustom, presetPrefs } from './presets'
import type { AppearancePrefs, ThemeMode } from './types'

const LEGACY_THEME_KEY = 'fatto_theme'
const STORAGE_KEY = 'mona_appearance_v1'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  toggleTheme: () => void
  appearance: AppearancePrefs
  setAppearance: (next: AppearancePrefs) => void
  patchAppearance: (patch: Partial<AppearancePrefs>) => void
  applyPreset: (id: Exclude<AppearancePrefs['preset'], 'custom'>) => void
  resetAppearance: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored(): AppearancePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppearancePrefs
      if (parsed?.colors && parsed?.type && parsed?.chrome) {
        if (
          parsed.preset === 'fatto-light' &&
          (parsed.colors.bg === '#f4eefb' ||
            parsed.chrome.sidebarBg === '#f3e7ff' ||
            parsed.chrome.sidebarBg === '#d9c6ff')
        ) {
          return presetPrefs('fatto-light')
        }
        return hydrateAppearance(parsed)
      }
    }
    const legacy = localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy === 'dark' || legacy === 'light') return defaultAppearance(legacy)
  } catch {
    /* ignore */
  }
  return defaultAppearance('light')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<AppearancePrefs>(() => {
    const initial = hydrateAppearance(readStored())
    applyAppearance(initial)
    return initial
  })

  useEffect(() => {
    applyAppearance(appearance)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
      localStorage.setItem(LEGACY_THEME_KEY, appearance.mode)
    } catch {
      /* ignore */
    }
  }, [appearance])

  const setAppearance = useCallback((next: AppearancePrefs) => setAppearanceState(next), [])

  const patchAppearance = useCallback((patch: Partial<AppearancePrefs>) => {
    setAppearanceState((prev) => {
      const next: AppearancePrefs = {
        ...prev,
        ...patch,
        colors: { ...prev.colors, ...(patch.colors || {}) },
        type: { ...prev.type, ...(patch.type || {}) },
        chrome: { ...prev.chrome, ...(patch.chrome || {}) },
      }
      if (!patch.preset) next.preset = 'custom'
      return next
    })
  }, [])

  const applyPreset = useCallback((id: Exclude<AppearancePrefs['preset'], 'custom'>) => {
    setAppearanceState(presetPrefs(id))
  }, [])

  const resetAppearance = useCallback(() => {
    setAppearanceState(defaultAppearance('light'))
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    setAppearanceState((prev) => {
      if (prev.preset === 'fatto-light' || prev.preset === 'fatto-dark' || prev.preset === 'custom') {
        if (prev.preset !== 'custom') return presetPrefs(mode === 'dark' ? 'fatto-dark' : 'fatto-light')
        return markCustom({ ...prev, mode })
      }
      return presetPrefs(mode === 'dark' ? 'fatto-dark' : 'fatto-light')
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setAppearanceState((prev) => {
      const nextMode: ThemeMode = prev.mode === 'dark' ? 'light' : 'dark'
      if (prev.preset === 'fatto-light' || prev.preset === 'fatto-dark') {
        return presetPrefs(nextMode === 'dark' ? 'fatto-dark' : 'fatto-light')
      }
      return markCustom({ ...prev, mode: nextMode })
    })
  }, [])

  const value = useMemo(
    () => ({
      theme: appearance.mode,
      setTheme,
      toggleTheme,
      appearance,
      setAppearance,
      patchAppearance,
      applyPreset,
      resetAppearance,
    }),
    [appearance, setTheme, toggleTheme, setAppearance, patchAppearance, applyPreset, resetAppearance],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export function useAppearance() {
  return useTheme()
}
