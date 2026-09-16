import { useEffect, useRef, useState } from 'react'
import {
  Columns2,
  ExternalLink,
  Grid2x2,
  Maximize2,
  Minimize2,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  Square,
  X,
} from 'lucide-react'
import {
  useWorkspaceTabs,
  type SnapPreset,
  type WorkspaceTab,
} from './WorkspaceTabsContext'
import { useTheme } from '../shared/theme/ThemeContext'
import { iconForPath } from '../shared/theme/tabIcon'

const SNAP_ACTIONS: { preset: SnapPreset; label: string; icon: typeof PanelLeft }[] = [
  { preset: 'left', label: 'Metade esquerda', icon: PanelLeft },
  { preset: 'right', label: 'Metade direita', icon: PanelRight },
  { preset: 'top', label: 'Metade superior', icon: PanelTop },
  { preset: 'bottom', label: 'Metade inferior', icon: PanelBottom },
  { preset: 'maximize', label: 'Maximizar', icon: Maximize2 },
  { preset: 'center', label: 'Centralizar', icon: Square },
  { preset: 'top-left', label: 'Canto SE', icon: Grid2x2 },
  { preset: 'top-right', label: 'Canto SD', icon: Columns2 },
  { preset: 'bottom-left', label: 'Canto IE', icon: Grid2x2 },
  { preset: 'bottom-right', label: 'Canto ID', icon: Columns2 },
]

type ResizeEdge = 'e' | 's' | 'se' | 'w' | 'n' | 'ne' | 'sw' | 'nw'

function FloatingWindow({ tab }: { tab: WorkspaceTab }) {
  const { updateFloat, bringToFront, dockTab, closeTab, snapFloat } = useWorkspaceTabs()
  const { appearance } = useTheme()
  const TabIcon = iconForPath(tab.path)
  const layout = tab.float!
  const dragRef = useRef<{ ox: number; oy: number; x: number; y: number } | null>(null)
  const resizeRef = useRef<{
    ox: number
    oy: number
    x: number
    y: number
    w: number
    h: number
    edge: ResizeEdge
  } | null>(null)
  const [highlighted, setHighlighted] = useState(false)
  const [snapOpen, setSnapOpen] = useState(false)

  useEffect(() => {
    const close = () => setSnapOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [])

  const onDragStart = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, [data-snap-menu]')) return
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { ox: e.clientX, oy: e.clientY, x: layout.x, y: layout.y }
    bringToFront(tab.id)
    setHighlighted(true)
  }

  const onDragMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.ox
    const dy = e.clientY - dragRef.current.oy
    updateFloat(tab.id, {
      x: dragRef.current.x + dx,
      y: dragRef.current.y + dy,
    })
  }

  const onDragEnd = () => {
    dragRef.current = null
    setHighlighted(false)
  }

  const onResizeStart = (edge: ResizeEdge) => (e: React.PointerEvent) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    resizeRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
      edge,
    }
    bringToFront(tab.id)
  }

  const onResizeMove = (e: React.PointerEvent) => {
    if (!resizeRef.current) return
    const { ox, oy, x, y, w, h, edge } = resizeRef.current
    const dx = e.clientX - ox
    const dy = e.clientY - oy
    const patch: Partial<typeof layout> = {}
    if (edge.includes('e')) patch.w = w + dx
    if (edge.includes('s')) patch.h = h + dy
    if (edge.includes('w')) {
      patch.x = x + dx
      patch.w = w - dx
    }
    if (edge.includes('n')) {
      patch.y = y + dy
      patch.h = h - dy
    }
    updateFloat(tab.id, patch)
  }

  const onResizeEnd = () => {
    resizeRef.current = null
  }

  const src = `${window.location.origin}${tab.path}${tab.path.includes('?') ? '&' : '?'}embed=1`

  const handle = (edge: ResizeEdge, className: string, cursor: string) => (
    <div
      className={`absolute z-10 ${className}`}
      style={{ cursor }}
      onPointerDown={onResizeStart(edge)}
      onPointerMove={onResizeMove}
      onPointerUp={onResizeEnd}
    />
  )

  return (
    <div
      className={`mona-window fixed overflow-hidden border ${
        highlighted ? 'ring-4 ring-brand-800/15' : ''
      }`}
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.w,
        height: layout.h,
        zIndex: layout.z,
      }}
      onPointerDown={() => bringToFront(tab.id)}
    >
      <div
        className="mona-window__titlebar relative flex h-10 shrink-0 cursor-grab items-center gap-1 border-b px-2 active:cursor-grabbing"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        {appearance.chrome.tabIcons && (
          <TabIcon size={14} className="shrink-0 text-ink-500" strokeWidth={1.9} />
        )}
        <p className="min-w-0 flex-1 truncate px-1 text-xs font-semibold">{tab.title}</p>
        <div className="relative shrink-0" data-snap-menu onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="rounded p-1.5 text-ink-600 hover:bg-white"
            title="Encaixe rápido (Ctrl+Shift+setas)"
            onClick={(e) => {
              e.stopPropagation()
              setSnapOpen((v) => !v)
            }}
          >
            <Grid2x2 size={14} />
          </button>
          {snapOpen && (
            <div
              className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-ink-100 bg-white p-1.5 shadow-xl"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-400">
                Encaixe
              </p>
              <div className="grid grid-cols-2 gap-0.5">
                {SNAP_ACTIONS.map(({ preset, label, icon: Icon }) => (
                  <button
                    key={preset}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] text-ink-700 hover:bg-ink-50"
                    onClick={() => {
                      snapFloat(tab.id, preset)
                      setSnapOpen(false)
                    }}
                  >
                    <Icon size={12} className="shrink-0 text-ink-400" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 border-t border-ink-50 px-2 pt-1 text-[10px] text-ink-400">
                Ctrl+Shift+←→↑↓ · Enter maximiza · D encaixa
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="shrink-0 rounded p-1.5 text-ink-500 hover:bg-white"
          title="Abrir em aba do browser"
          onClick={() => window.open(src, '_blank')}
        >
          <ExternalLink size={14} />
        </button>
        <button
          type="button"
          className="shrink-0 rounded p-1.5 text-ink-500 hover:bg-white"
          title="Encaixar no layout"
          onClick={() => dockTab(tab.id)}
        >
          <Minimize2 size={14} />
        </button>
        <button
          type="button"
          className="shrink-0 rounded p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600"
          title="Fechar"
          aria-label="Fechar janela"
          onClick={() => closeTab(tab.id)}
        >
          <X size={14} />
        </button>
      </div>
      <iframe title={tab.title} src={src} className="h-[calc(100%-40px)] w-full border-0 bg-white" />
      {handle('n', 'left-3 right-3 top-0 h-1.5', 'ns-resize')}
      {handle('s', 'bottom-0 left-3 right-3 h-1.5', 'ns-resize')}
      {handle('w', 'bottom-3 left-0 top-10 w-1.5', 'ew-resize')}
      {handle('e', 'bottom-3 right-0 top-10 w-1.5', 'ew-resize')}
      {handle('nw', 'left-0 top-0 h-3 w-3', 'nwse-resize')}
      {handle('ne', 'right-0 top-0 h-3 w-3', 'nesw-resize')}
      {handle('sw', 'bottom-0 left-0 h-3 w-3', 'nesw-resize')}
      {handle('se', 'bottom-0 right-0 h-3 w-3', 'nwse-resize')}
      <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 bg-gradient-to-br from-transparent to-ink-300" />
    </div>
  )
}

export function FloatingTabsLayer() {
  const { tabs } = useWorkspaceTabs()
  const floating = tabs.filter((t) => t.mode === 'floating' && t.float)
  if (!floating.length) return null
  return (
    <>
      {floating.map((tab) => (
        <FloatingWindow key={tab.id} tab={tab} />
      ))}
    </>
  )
}
