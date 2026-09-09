import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export type TabMode = 'docked' | 'floating'

export type SnapPreset =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'maximize'
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface FloatingLayout {
  x: number
  y: number
  w: number
  h: number
  z: number
}

export interface WorkspaceTab {
  id: string
  path: string
  title: string
  mode: TabMode
  float?: FloatingLayout
}

interface WorkspaceTabsContextValue {
  tabs: WorkspaceTab[]
  activeId: string | null
  openTab: (path: string, title: string) => void
  renameTab: (path: string, title: string) => void
  closeTab: (id: string) => void
  /** Fecha todas as outras abas (dock + float), mantém `id`. */
  closeOthers: (id: string) => void
  /** Fecha abas dockadas à direita da alvo (índice na barra dock). */
  closeToTheRight: (id: string) => void
  /** Fecha todas as abas e volta ao Dashboard. */
  closeAll: () => void
  activateTab: (id: string) => void
  floatTab: (id: string) => void
  dockTab: (id: string) => void
  dockAll: () => void
  updateFloat: (id: string, patch: Partial<FloatingLayout>) => void
  bringToFront: (id: string) => void
  snapFloat: (id: string, preset: SnapPreset) => void
  clampAllFloats: () => void
  reorderDocked: (fromIndex: number, toIndex: number) => void
  cycleFloating: (dir: 1 | -1) => void
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null)
const STORAGE_KEY = 'fatto_workspace_tabs_v2'
/** Acima da sidebar (z-30) e do dropdown de notificações (z-40). */
export const FLOAT_Z_BASE = 50
const TITLE_BAR = 40
const MIN_W = 320
const MIN_H = 240
const PAD = 8

function titleFromPath(path: string): string {
  if (path === '/') return 'Dashboard'
  const parts = path.split('/').filter(Boolean)
  const map: Record<string, string> = {
    clientes: 'Clientes',
    prestadores: 'Prestadores',
    financeiro: 'Financeiro',
    agenda: 'Agenda',
    todos: 'Tarefas',
    contratos: 'Contratos',
    sops: 'SOPs',
    onboarding: 'Onboarding',
    configuracoes: 'Configurações',
    apps: 'Apps',
    parceiras: 'Parceiras',
    servicos: 'Serviços',
    piramide: 'Pirâmide',
    compartilhar: 'Compartilhar',
    faqs: 'FAQs',
    emails: 'E-mails',
    whatsapp: 'WhatsApp',
    chat: 'Chat interno',
    notificacoes: 'Notificações',
    operacao: 'Modo operação',
  }
  if (parts[0] === 'clientes' && parts.length >= 2) return 'Cliente'
  if (parts.length >= 2 && map[parts[0]]) return `${map[parts[0]]} · detalhe`
  return map[parts[0]] || path
}

function nextZ(tabs: WorkspaceTab[]) {
  return Math.max(FLOAT_Z_BASE, ...tabs.map((t) => t.float?.z ?? FLOAT_Z_BASE)) + 1
}

export function clampLayout(layout: FloatingLayout, vw = window.innerWidth, vh = window.innerHeight): FloatingLayout {
  const w = Math.min(Math.max(MIN_W, layout.w), Math.max(MIN_W, vw - PAD * 2))
  const h = Math.min(Math.max(MIN_H, layout.h), Math.max(MIN_H, vh - PAD * 2))
  // Mantém a barra de título sempre na viewport (fechar/encaixar acessíveis).
  const minX = PAD - w + 120
  const maxX = vw - 120
  const minY = PAD
  const maxY = vh - TITLE_BAR
  const x = Math.min(maxX, Math.max(minX, layout.x))
  const y = Math.min(maxY, Math.max(minY, layout.y))
  return { ...layout, x, y, w, h, z: Math.max(FLOAT_Z_BASE, layout.z) }
}

export function layoutForSnap(preset: SnapPreset, z: number): FloatingLayout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = 10
  const halfW = Math.floor((vw - gap * 3) / 2)
  const halfH = Math.floor((vh - gap * 3) / 2)
  const fullW = vw - gap * 2
  const fullH = vh - gap * 2

  const base = { z }
  switch (preset) {
    case 'left':
      return clampLayout({ ...base, x: gap, y: gap, w: halfW, h: fullH })
    case 'right':
      return clampLayout({ ...base, x: gap * 2 + halfW, y: gap, w: halfW, h: fullH })
    case 'top':
      return clampLayout({ ...base, x: gap, y: gap, w: fullW, h: halfH })
    case 'bottom':
      return clampLayout({ ...base, x: gap, y: gap * 2 + halfH, w: fullW, h: halfH })
    case 'maximize':
      return clampLayout({ ...base, x: gap, y: gap, w: fullW, h: fullH })
    case 'center':
      return clampLayout({
        ...base,
        w: Math.min(860, fullW),
        h: Math.min(620, fullH),
        x: Math.floor((vw - Math.min(860, fullW)) / 2),
        y: Math.floor((vh - Math.min(620, fullH)) / 2),
      })
    case 'top-left':
      return clampLayout({ ...base, x: gap, y: gap, w: halfW, h: halfH })
    case 'top-right':
      return clampLayout({ ...base, x: gap * 2 + halfW, y: gap, w: halfW, h: halfH })
    case 'bottom-left':
      return clampLayout({ ...base, x: gap, y: gap * 2 + halfH, w: halfW, h: halfH })
    case 'bottom-right':
      return clampLayout({ ...base, x: gap * 2 + halfW, y: gap * 2 + halfH, w: halfW, h: halfH })
  }
}

function normalize(tabs: WorkspaceTab[]): WorkspaceTab[] {
  return tabs.map((t) => {
    const mode = t.mode === 'floating' ? 'floating' : 'docked'
    if (mode === 'floating' && t.float) {
      return { ...t, mode, float: clampLayout({ ...t.float, z: Math.max(FLOAT_Z_BASE, t.float.z) }) }
    }
    return { ...t, mode, float: t.float }
  })
}

export function WorkspaceTabsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      return normalize(JSON.parse(raw) as WorkspaceTab[])
    } catch {
      return []
    }
  })
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
  }, [tabs])

  const clampAllFloats = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => (t.mode === 'floating' && t.float ? { ...t, float: clampLayout(t.float) } : t)),
    )
  }, [])

  useEffect(() => {
    const onResize = () => clampAllFloats()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampAllFloats])

  const openTab = useCallback((path: string, title: string) => {
    let nextActive: string | null = null
    setTabs((prev) => {
      const existing = prev.find((t) => t.path === path)
      if (existing) {
        nextActive = existing.id
        return prev.map((t) => {
          if (t.id !== existing.id) return t
          const nextTitle =
            title && title !== 'Cliente' && title !== existing.title ? title : t.title
          if (t.mode === 'floating' && t.float) {
            return { ...t, title: nextTitle, float: { ...t.float, z: nextZ(prev) } }
          }
          return nextTitle === t.title ? t : { ...t, title: nextTitle }
        })
      }
      const tab: WorkspaceTab = { id: crypto.randomUUID(), path, title, mode: 'docked' }
      nextActive = tab.id
      return [...prev, tab]
    })
    // Evita setState em BrowserRouter durante o updater de setTabs
    queueMicrotask(() => {
      if (nextActive) setActiveId(nextActive)
    })
  }, [])

  const renameTab = useCallback((path: string, title: string) => {
    if (!title.trim()) return
    setTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, title: title.trim() } : t)),
    )
  }, [])

  useEffect(() => {
    const path = location.pathname
    if (path === '/login' || path.startsWith('/s/')) return
    openTab(path, titleFromPath(path))
  }, [location.pathname, openTab])

  const closeTab = useCallback(
    (id: string) => {
      let nextActive: string | null | undefined
      let navTo: string | null | undefined
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === id)
        if (idx < 0) return prev
        const closing = prev[idx]
        const next = prev.filter((t) => t.id !== id)
        if (activeId === id || (closing.mode === 'docked' && location.pathname === closing.path)) {
          const docked = next.filter((t) => t.mode === 'docked')
          const fallback = docked[Math.max(0, idx - 1)] || docked[0] || next[0]
          nextActive = fallback?.id ?? null
          if (fallback?.mode === 'docked') navTo = fallback.path
          else if (!fallback) navTo = '/'
        }
        return next
      })
      queueMicrotask(() => {
        if (nextActive !== undefined) setActiveId(nextActive)
        if (navTo) navigate(navTo)
      })
    },
    [activeId, location.pathname, navigate],
  )

  const closeOthers = useCallback(
    (id: string) => {
      let keepPath: string | null = null
      setTabs((prev) => {
        const keep = prev.find((t) => t.id === id)
        if (!keep) return prev
        keepPath = keep.mode === 'docked' ? keep.path : keep.path
        return [{ ...keep, mode: 'docked' as const }]
      })
      queueMicrotask(() => {
        setActiveId(id)
        if (keepPath) navigate(keepPath)
      })
    },
    [navigate],
  )

  const closeToTheRight = useCallback(
    (id: string) => {
      let nextActive: string | null | undefined
      let navTo: string | null | undefined
      setTabs((prev) => {
        const docked = prev.filter((t) => t.mode === 'docked')
        const floating = prev.filter((t) => t.mode === 'floating')
        const idx = docked.findIndex((t) => t.id === id)
        if (idx < 0) return prev
        const keptDocked = docked.slice(0, idx + 1)
        const removed = docked.slice(idx + 1)
        const next = [...keptDocked, ...floating]
        const removedActive =
          removed.some((t) => t.id === activeId) ||
          removed.some((t) => t.path === location.pathname)
        if (removedActive) {
          const fallback = keptDocked[keptDocked.length - 1]
          nextActive = fallback?.id ?? null
          navTo = fallback?.path ?? '/'
        }
        return next
      })
      queueMicrotask(() => {
        if (nextActive !== undefined) setActiveId(nextActive)
        if (navTo) navigate(navTo)
      })
    },
    [activeId, location.pathname, navigate],
  )

  const closeAll = useCallback(() => {
    setTabs([])
    queueMicrotask(() => {
      setActiveId(null)
      navigate('/')
    })
  }, [navigate])

  const activateTab = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id)
      if (!tab) return
      setActiveId(id)
      if (tab.mode === 'docked') navigate(tab.path)
      else {
        setTabs((prev) =>
          prev.map((t) =>
            t.id === id && t.float ? { ...t, float: clampLayout({ ...t.float, z: nextZ(prev) }) } : t,
          ),
        )
      }
    },
    [navigate, tabs],
  )

  const floatTab = useCallback(
    (id: string) => {
      let navTo: string | null | undefined
      let nextActive: string | null | undefined
      setTabs((prev) => {
        const z = nextZ(prev)
        const offset = prev.filter((t) => t.mode === 'floating').length * 28
        const next = prev.map((t) =>
          t.id === id
            ? {
                ...t,
                mode: 'floating' as const,
                float: clampLayout(
                  t.float ?? {
                    x: 80 + offset,
                    y: 100 + offset,
                    w: 720,
                    h: 520,
                    z,
                  },
                ),
              }
            : t,
        )
        // Evita página duplicada / buraco sob a barra: foca outra aba dockada
        const docked = next.filter((t) => t.mode === 'docked')
        const floated = prev.find((t) => t.id === id)
        const wasShowing =
          activeId === id || (floated != null && location.pathname === floated.path)
        if (wasShowing && docked.length > 0) {
          nextActive = docked[0].id
          navTo = docked[0].path
        } else if (wasShowing && docked.length === 0) {
          navTo = '/'
        }
        return next
      })
      queueMicrotask(() => {
        if (nextActive) setActiveId(nextActive)
        else setActiveId(id)
        if (navTo) navigate(navTo)
      })
    },
    [activeId, location.pathname, navigate],
  )

  const dockTab = useCallback(
    (id: string) => {
      let path: string | null = null
      setTabs((prev) => {
        const tab = prev.find((t) => t.id === id)
        path = tab?.path ?? null
        return prev.map((t) => (t.id === id ? { ...t, mode: 'docked' as const } : t))
      })
      queueMicrotask(() => {
        setActiveId(id)
        if (path) navigate(path)
      })
    },
    [navigate],
  )

  const dockAll = useCallback(() => {
    setTabs((prev) => prev.map((t) => ({ ...t, mode: 'docked' as const })))
  }, [])

  const updateFloat = useCallback((id: string, patch: Partial<FloatingLayout>) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === id && t.float
          ? { ...t, float: clampLayout({ ...t.float, ...patch }) }
          : t,
      ),
    )
  }, [])

  const bringToFront = useCallback((id: string) => {
    setTabs((prev) => {
      const z = nextZ(prev)
      return prev.map((t) =>
        t.id === id && t.float ? { ...t, float: { ...t.float, z } } : t,
      )
    })
    setActiveId(id)
  }, [])

  const snapFloat = useCallback((id: string, preset: SnapPreset) => {
    setTabs((prev) => {
      const z = nextZ(prev)
      return prev.map((t) =>
        t.id === id
          ? { ...t, mode: 'floating' as const, float: layoutForSnap(preset, z) }
          : t,
      )
    })
    setActiveId(id)
  }, [])

  const reorderDocked = useCallback((fromIndex: number, toIndex: number) => {
    setTabs((prev) => {
      const docked = prev.filter((t) => t.mode === 'docked')
      const floating = prev.filter((t) => t.mode === 'floating')
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= docked.length || toIndex >= docked.length)
        return prev
      const nextDocked = [...docked]
      const [item] = nextDocked.splice(fromIndex, 1)
      nextDocked.splice(toIndex, 0, item)
      return [...nextDocked, ...floating]
    })
  }, [])

  const cycleFloating = useCallback(
    (dir: 1 | -1) => {
      const floating = tabs.filter((t) => t.mode === 'floating')
      if (!floating.length) return
      const idx = Math.max(
        0,
        floating.findIndex((t) => t.id === activeId),
      )
      const next = floating[(idx + dir + floating.length) % floating.length]
      if (next) activateTab(next.id)
    },
    [activateTab, activeId, tabs],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey
      if (!meta || !e.shiftKey) return
      const floating = tabs.filter((t) => t.mode === 'floating' && t.float)
      const target =
        floating.find((t) => t.id === activeId) ||
        [...floating].sort((a, b) => (b.float?.z ?? 0) - (a.float?.z ?? 0))[0]
      if (!target) return

      const map: Record<string, SnapPreset | 'dock' | 'cycle-next' | 'cycle-prev'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'top',
        ArrowDown: 'bottom',
        Enter: 'maximize',
        KeyC: 'center',
        KeyD: 'dock',
        Period: 'cycle-next',
        Comma: 'cycle-prev',
      }
      const action = map[e.code]
      if (!action) return
      e.preventDefault()
      if (action === 'dock') dockTab(target.id)
      else if (action === 'cycle-next') cycleFloating(1)
      else if (action === 'cycle-prev') cycleFloating(-1)
      else snapFloat(target.id, action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, cycleFloating, dockTab, snapFloat, tabs])

  const value = useMemo(
    () => ({
      tabs,
      activeId,
      openTab,
      renameTab,
      closeTab,
      closeOthers,
      closeToTheRight,
      closeAll,
      activateTab,
      floatTab,
      dockTab,
      dockAll,
      updateFloat,
      bringToFront,
      snapFloat,
      clampAllFloats,
      reorderDocked,
      cycleFloating,
    }),
    [
      tabs,
      activeId,
      openTab,
      renameTab,
      closeTab,
      closeOthers,
      closeToTheRight,
      closeAll,
      activateTab,
      floatTab,
      dockTab,
      dockAll,
      updateFloat,
      bringToFront,
      snapFloat,
      clampAllFloats,
      reorderDocked,
      cycleFloating,
    ],
  )

  return <WorkspaceTabsContext.Provider value={value}>{children}</WorkspaceTabsContext.Provider>
}

export function useWorkspaceTabs() {
  const ctx = useContext(WorkspaceTabsContext)
  if (!ctx) throw new Error('useWorkspaceTabs must be used within WorkspaceTabsProvider')
  return ctx
}
