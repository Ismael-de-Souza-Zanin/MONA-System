import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useId,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  Settings,
  HelpCircle,
  Bell,
  Search,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MessageSquare,
  LayoutPanelTop,
  Moon,
  Sun,
  Plus,
  ChevronDown,
  CalendarDays,
  CheckSquare,
  ChevronsRight,
  Maximize2,
  SquareStack,
  Users,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  BarChart3,
  ListChecks,
  ArrowRight,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../shared/api/client'
import type { AgendaEvent, Client, TodoItem } from '../shared/types'
import { useAuth } from '../shared/auth/AuthContext'
import { useTheme } from '../shared/theme/ThemeContext'
import { iconForPath } from '../shared/theme/tabIcon'
import { usePermissions } from '../shared/permissions/hooks'
import { Permissions } from '../shared/permissions/constants'
import {
  NAV_DEFINITIONS,
  groupedNav,
  navGroupIdForPath,
  resolveMenu,
  type NavDefinition,
} from '../shared/nav/navConfig'
import { useNotifications, useUserPreferences } from '../shared/hooks/useWorkspaceData'
import { WorkspaceTabsProvider, useWorkspaceTabs } from './WorkspaceTabsContext'
import { FloatingTabsLayer } from './FloatingTabsLayer'
import { ChatWidget } from '../features/chat/ChatWidget'
import type { LucideIcon } from 'lucide-react'
import { BrandLogo, MonaFolder, StatusDot, getStatusLabel } from '../shared/ui'
import { PageTutorialHost, reopenPageTutorial } from '../shared/tutorial/PageTutorial'

const WHATSAPP_URL = 'https://wa.me/5511999999999'
const SIDEBAR_KEY = 'fatto_sidebar_collapsed'
const NAV_GROUPS_KEY = 'mona_nav_groups_v1'
const QUICK_PANEL_OPEN_KEY = 'mona_quick_panel_open_v1'
const QUICK_PANEL_WIDTH_KEY = 'mona_quick_panel_width_v1'
const QUICK_PANEL_WIDGETS_KEY = 'mona_quick_panel_widgets_v1'
const FAN_COLORS = ['#F54D7D', '#582B86', '#8B4BB8', '#FF7A33', '#C45BA8']
type QuickWidgetId = 'agenda' | 'todos' | 'clients' | 'overview'
type QuickWidgetSize = 'compact' | 'expanded'
type QuickWidget = { id: QuickWidgetId; visible: boolean; size: QuickWidgetSize }
const QUICK_WIDGET_DEFAULTS: QuickWidget[] = [
  { id: 'agenda', visible: true, size: 'expanded' },
  { id: 'todos', visible: true, size: 'expanded' },
  { id: 'clients', visible: true, size: 'compact' },
  { id: 'overview', visible: false, size: 'compact' },
]

function readQuickWidgets(): QuickWidget[] {
  if (typeof window === 'undefined') return QUICK_WIDGET_DEFAULTS
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(QUICK_PANEL_WIDGETS_KEY) || 'null')
    if (!Array.isArray(stored)) return QUICK_WIDGET_DEFAULTS
    const valid = stored.filter((item): item is QuickWidget =>
      item && typeof item === 'object' &&
      QUICK_WIDGET_DEFAULTS.some((widget) => widget.id === item.id) &&
      typeof item.visible === 'boolean' &&
      (item.size === 'compact' || item.size === 'expanded'),
    )
    const unique = valid.filter((item, index) => valid.findIndex((entry) => entry.id === item.id) === index)
    return [...unique, ...QUICK_WIDGET_DEFAULTS.filter((item) => !unique.some((entry) => entry.id === item.id))]
  } catch {
    return QUICK_WIDGET_DEFAULTS
  }
}

function hintOffset(index: number, count: number, upward = false) {
  if (count <= 1) return { x: 0, y: 0 }
  const radius = 3.4 + count * 0.55
  const span = Math.min(Math.PI * 0.78, 0.32 * count)
  const start = upward ? -Math.PI * 0.88 : Math.PI * 0.12
  const t = start + (span * index) / (count - 1)
  return { x: Math.cos(t) * radius, y: Math.sin(t) * radius }
}

function fanOffset(index: number, count: number, radius = 128, upward = false) {
  if (count <= 1) return upward ? { x: 0, y: -radius } : { x: radius, y: 0 }
  const span = Math.min(Math.PI * (count > 6 ? 0.92 : 0.58), 0.4 * Math.max(count, 2))
  const mid = upward ? -Math.PI / 2 : 0
  const start = mid - span / 2
  const end = mid + span / 2
  const t = start + ((end - start) * index) / (count - 1)
  return { x: Math.round(Math.cos(t) * radius), y: Math.round(Math.sin(t) * radius) }
}

function dockFanOffset(index: number, count: number, viewportWidth: number) {
  if (count <= 1) return { x: 0, y: -112 }
  const spacing = Math.min(76, (viewportWidth - 80) / (count - 1))
  const progress = (index / (count - 1)) * 2 - 1
  return {
    x: Math.round((index - (count - 1) / 2) * spacing),
    y: Math.round(-126 + 36 * progress * progress),
  }
}

function BrandMark({ compact }: { compact?: boolean }) {
  return <BrandLogo size={compact ? 48 : 42} showWordmark={!compact} title="MONA" />
}

function TabShape() {
  const gradientId = useId()
  return (
    <svg className="mona-tab__shape" viewBox="0 0 122 40" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="65%">
          <stop className="mona-tab__gradient-top" offset="0%" />
          <stop className="mona-tab__gradient-bottom" offset="100%" />
        </linearGradient>
      </defs>
      <path
        d="M122 40.036C122 34 119.5 30.1 116.486 29.036c-23.582-8-14.821-29-42.018-29h-62.4C5.441,0.036,0,5.376,0,12.003v28.033z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  )
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  compact,
  end,
  caption,
  forceActive,
}: {
  to: string
  label: string
  icon: LucideIcon
  compact?: boolean
  end?: boolean
  caption?: boolean
  forceActive?: boolean
}) {
  const [iconCycle, setIconCycle] = useState(0)
  return (
    <div className={compact ? 'group relative' : undefined}>
      <NavLink
        to={to}
        end={end}
        onClick={() => setIconCycle((cycle) => cycle + 1)}
        aria-label={compact && !caption ? label : undefined}
        className={({ isActive }) =>
          `mona-sidebar__link ${compact ? 'is-compact' : ''} ${caption ? 'is-labeled' : ''} ${isActive || forceActive ? 'is-active' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <span className="mona-sidebar__link-inner">
              <Icon
                key={`${to}-${isActive ? 'on' : 'off'}-${iconCycle}`}
                size={compact ? 18 : 16}
                strokeWidth={1.8}
              />
            </span>
            {caption && <span className="mona-sidebar__link-caption">{label}</span>}
            {!compact && !caption && <span className="mona-sidebar__link-label">{label}</span>}
          </>
        )}
      </NavLink>
      {compact && !caption && (
        <span
          className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[90] -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100"
          role="tooltip"
        >
          {label}
        </span>
      )}
    </div>
  )
}

function CompactGroupFan({
  label,
  icon: Icon,
  items,
  open,
  onToggle,
  onNavigate,
  upward = false,
  caption = false,
}: {
  label: string
  icon: LucideIcon
  items: NavDefinition[]
  open: boolean
  onToggle: () => void
  onNavigate: () => void
  upward?: boolean
  caption?: boolean
}) {
  const location = useLocation()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [origin, setOrigin] = useState({ top: 0, left: 0 })
  const [from, setFrom] = useState<{ x: number; y: number }[]>([])
  const [iconCycle, setIconCycle] = useState(0)
  const childActive = items.some((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  )
  const fanPositions = items.map((_, index) =>
    upward ? dockFanOffset(index, items.length, window.innerWidth) : fanOffset(index, items.length),
  )
  const leftEdge = origin.left + Math.min(...fanPositions.map((pos) => pos.x))
  const rightEdge = origin.left + Math.max(...fanPositions.map((pos) => pos.x))
  const edgeInset = 40
  const fanShiftX = upward
    ? leftEdge < edgeInset ? edgeInset - leftEdge : rightEdge > window.innerWidth - edgeInset ? window.innerWidth - edgeInset - rightEdge : 0
    : 0

  useLayoutEffect(() => {
    const node = triggerRef.current
    if (!node) return
    const place = () => {
      const rect = node.getBoundingClientRect()
      const inner = node.querySelector('.mona-sidebar__link-inner')
      const innerRect = inner?.getBoundingClientRect()
      const nextOrigin = upward
        ? {
            top: Math.round((innerRect ?? rect).top),
            left: Math.round((innerRect ?? rect).left + (innerRect ?? rect).width / 2),
          }
        : { top: rect.top + rect.height / 2, left: rect.right }
      setOrigin(nextOrigin)
      if (!innerRect) return
      const cx = upward ? innerRect.left + innerRect.width / 2 : innerRect.right + 2 - 8
      const cy = upward ? innerRect.top + 2 : innerRect.bottom - 1 - 8
      setFrom(
        items.map((_, index) => {
          const pos = hintOffset(index, items.length, upward)
          return {
            x: Math.round(cx + pos.x - nextOrigin.left),
            y: Math.round(cy + pos.y - nextOrigin.top),
          }
        }),
      )
    }
    place()
    const later = window.setTimeout(place, 240)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null
    ro?.observe(node)
    return () => {
      window.clearTimeout(later)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      ro?.disconnect()
    }
  }, [items, open, childActive, upward])

  return (
    <div className={`mona-fan group relative ${open ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`mona-sidebar__link is-compact ${caption ? 'is-labeled' : ''} ${childActive || open ? 'is-active' : ''}`}
        aria-expanded={open}
        aria-label={`${label}, grupo com ${items.length} itens`}
        onClick={() => {
          if (upward) triggerRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
          setIconCycle((cycle) => cycle + 1)
          onToggle()
        }}
      >
        <span className="mona-sidebar__link-inner">
          <Icon key={`${label}-${childActive || open ? 'on' : 'off'}-${iconCycle}`} size={18} strokeWidth={1.8} />
        </span>
        {caption && <span className="mona-sidebar__link-caption">{label}</span>}
      </button>
      {!caption && (
      <span
        className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[90] -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100"
        role="tooltip"
      >
        {label}
      </span>
      )}
      {createPortal(
        <div
          className={`mona-fan__list ${open ? 'is-open' : ''} ${upward ? 'is-up' : ''}`}
          style={{ top: origin.top, left: origin.left }}
          aria-hidden={!open}
        >
          {items.map((item, index) => {
            const ItemIcon = item.icon
            let pos = { ...fanPositions[index], x: fanPositions[index].x + fanShiftX }
            if (upward) {
              const absY = origin.top + pos.y
              const yMin = 72
              if (absY < yMin) pos = { ...pos, y: pos.y + (yMin - absY) }
            }
            const start = from[index] ?? (upward ? { x: 0, y: 8 } : { x: -12, y: 10 })
            const itemActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
            return (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === '/'}
                tabIndex={open ? 0 : -1}
                className={`mona-fan__item ${itemActive ? 'is-active' : ''}`}
                style={
                  {
                    backgroundColor: FAN_COLORS[index % FAN_COLORS.length],
                    '--from-x': `${start.x}px`,
                    '--from-y': `${start.y}px`,
                    '--fan-x': `${pos.x}px`,
                    '--fan-y': `${pos.y}px`,
                    transitionDelay: open
                      ? `${index * 40}ms`
                      : `${(items.length - 1 - index) * 28}ms`,
                  } as CSSProperties
                }
                aria-label={item.label}
                title={item.label}
                onClick={onNavigate}
              >
                <ItemIcon size={18} strokeWidth={1.8} />
                <span className="mona-fan__title">{item.label}</span>
              </NavLink>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}

function notchPath(depth: number, size: number, scoop: number) {
  const w = depth
  const s = scoop
  const r = Math.min(size / 2, w)
  const top = s
  const bot = s + size
  const h = bot + s
  const k = s * 0.55
  return [
    `M ${w} 0`,
    `C ${w} ${k} ${w - s + k} ${top} ${w - s} ${top}`,
    `L ${r} ${top}`,
    `A ${r} ${r} 0 0 0 0 ${top + r}`,
    `A ${r} ${r} 0 0 0 ${r} ${bot}`,
    `L ${w - s} ${bot}`,
    `C ${w - s + k} ${bot} ${w} ${h - k} ${w} ${h}`,
    `L ${w} 0`,
    'Z',
  ].join(' ')
}

function notchPathUp(depth: number, size: number, scoop: number) {
  const w = depth
  const s = scoop
  const r = Math.min(size / 2, w)
  const top = s
  const bot = s + size
  const h = bot + s
  const k = s * 0.55
  return [
    `M 0 0`,
    `C ${k} 0 ${top} ${s - k} ${top} ${s}`,
    `L ${top} ${w - r}`,
    `A ${r} ${r} 0 0 0 ${top + r} ${w}`,
    `A ${r} ${r} 0 0 0 ${bot} ${w - r}`,
    `L ${bot} ${s}`,
    `C ${bot} ${s - k} ${h - k} 0 ${h} 0`,
    `L 0 0`,
    'Z',
  ].join(' ')
}

function notchForLayout(
  layout: 'compact' | 'full',
  size: number,
  depth: number,
  scoop: number,
  orientation: 'vertical' | 'horizontal' = 'vertical',
  circle = 39,
) {
  if (orientation === 'horizontal') {
    const nextSize = Math.max(40, Math.round(circle + 4))
    const nextScoop = Math.max(12, Math.round(scoop * 0.64))
    const nextDepth = Math.round(nextSize / 2 + nextScoop)
    return { size: nextSize, depth: nextDepth, scoop: nextScoop }
  }
  if (layout === 'compact') return { size, depth, scoop }
  return {
    size: Math.max(36, Math.round(size * 0.44)),
    depth: Math.max(26, Math.round(depth * 0.46)),
    scoop: Math.max(8, Math.round(scoop * 0.36)),
  }
}

function SidebarIndicator({
  enabled,
  layout,
  tick = '',
  orientation = 'vertical',
}: {
  enabled: boolean
  layout: 'compact' | 'full'
  tick?: string
  orientation?: 'vertical' | 'horizontal'
}) {
  const location = useLocation()
  const { appearance } = useTheme()
  const notchSize = appearance.chrome.notchSize ?? 64
  const notchDepth = appearance.chrome.notchDepth ?? 59
  const notchScoop = appearance.chrome.notchScoop ?? 19
  const notchCircle = appearance.chrome.notchCircle ?? 39
  const metrics = notchForLayout(layout, notchSize, notchDepth, notchScoop, orientation, notchCircle)
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false, ready: false })

  useEffect(() => {
    const host = document.querySelector<HTMLElement>('.mona-sidebar')
    if (!host || !enabled) {
      host?.querySelectorAll('.is-notch-item').forEach((el) => el.classList.remove('is-notch-item'))
      host?.classList.remove('has-notch', 'is-notch-ready')
      setPos((prev) => ({ ...prev, visible: false }))
      return
    }

    const resolveTarget = () => {
      const more = host.querySelector<HTMLElement>('.mona-sidebar__more.is-open')
      if (more) return more
      const fan = host.querySelector<HTMLElement>('.mona-fan.is-open > .mona-sidebar__link')
      if (fan) return fan
      const actives = [...host.querySelectorAll<HTMLElement>('.mona-sidebar__link.is-active')].filter(
        (el) => !el.closest('.mona-sidebar__cta-slot'),
      )
      const active = actives[0]
      if (!active) return null
      const panel = active.closest('.mona-sidebar__group-panel')
      if (panel && !panel.classList.contains('is-open')) {
        return panel.parentElement?.querySelector<HTMLElement>('.mona-sidebar__group-toggle') ?? active
      }
      return active
    }

    const markNotch = (item: HTMLElement | null) => {
      host.querySelectorAll('.is-notch-item').forEach((el) => {
        if (el !== item) el.classList.remove('is-notch-item')
      })
      if (item && !item.classList.contains('is-notch-item')) item.classList.add('is-notch-item')
    }

    const update = () => {
      const item = resolveTarget()
      if (!item) {
        markNotch(null)
        setPos((prev) => (prev.visible ? { ...prev, visible: false } : prev))
        return
      }
      markNotch(item)
      const hostRect = host.getBoundingClientRect()
      const bubble = item.querySelector<HTMLElement>('.mona-sidebar__link-inner') ?? item
      const itemRect = (orientation === 'horizontal' ? item : bubble).getBoundingClientRect()
      const scoop = metrics.scoop
      const y = Math.max(0, Math.round(itemRect.top - hostRect.top + (itemRect.height - metrics.size) / 2 - scoop))
      const rawX = Math.round(itemRect.left - hostRect.left + (itemRect.width - metrics.size) / 2 - scoop)
      const maskAlong = metrics.size + scoop * 2
      const x =
        orientation === 'horizontal'
          ? Math.max(4, Math.min(rawX, Math.round(hostRect.width - maskAlong - 4)))
          : rawX
      setPos((prev) =>
        prev.x === x && prev.y === y && prev.visible ? prev : { x, y, visible: true, ready: prev.ready },
      )
    }

    update()
    const frame = requestAnimationFrame(() => {
      setPos((prev) => (prev.ready ? prev : { ...prev, ready: true }))
    })
    const later = window.setTimeout(update, 320)
    const nav = host.querySelector('nav')
    const dock = host.querySelector('[data-sidebar-dock]')
    nav?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(host)
    if (nav) ro?.observe(nav)
    if (dock) ro?.observe(dock)
    const observer = new MutationObserver((changes) => {
      if (changes.some((change) => change.type === 'childList' ||
        (change.target instanceof HTMLElement && change.target.classList.contains('mona-sidebar__link')))) {
        update()
      }
    })
    observer.observe(host, { childList: true, attributes: true, attributeFilter: ['class', 'aria-current'], subtree: true })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(later)
      nav?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro?.disconnect()
      observer.disconnect()
    }
  }, [enabled, layout, location.pathname, tick, metrics.size, metrics.depth, metrics.scoop, appearance.chrome.notchCircle, appearance.chrome.notchPop, orientation])

  const path =
    orientation === 'horizontal'
      ? notchPathUp(metrics.depth, metrics.size, metrics.scoop)
      : notchPath(metrics.depth, metrics.size, metrics.scoop)
  const maskAlong = metrics.size + metrics.scoop * 2
  const maskAcross = metrics.depth

  useEffect(() => {
    const host = document.querySelector<HTMLElement>('.mona-sidebar')
    if (!host) return
    const pad = 3
    const stroke = orientation === 'horizontal' ? 2 : 3
    const svgW = (orientation === 'horizontal' ? maskAlong : maskAcross) + pad * 2
    const svgH = (orientation === 'horizontal' ? maskAcross : maskAlong) + pad * 2
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${svgW} ${svgH}" width="${svgW}" height="${svgH}"><path fill="black" stroke="black" stroke-width="${stroke}" stroke-linejoin="round" d="${path}"/></svg>`
    host.style.setProperty('--mona-notch-shape', `url("data:image/svg+xml,${encodeURIComponent(svg)}")`)
    host.style.setProperty('--mona-notch-mask-size', `${svgW}px ${svgH}px`)
    if (orientation === 'horizontal') {
      host.style.setProperty('--mona-notch-x', `${pos.x - pad}px`)
    } else {
      host.style.setProperty('--mona-notch-y', `${pos.y - pad}px`)
    }
    host.classList.toggle('has-notch', pos.visible)
    host.classList.toggle('is-notch-ready', pos.ready)
  }, [path, maskAlong, maskAcross, orientation, pos])

  return null
}

type TabMenuState = {
  tabId: string
  mode: 'docked' | 'floating'
  x: number
  y: number
  dockIndex: number
  dockCount: number
}

const TAB_MENU_W = 220
const TAB_MENU_H = 340

function WorkspaceTabBar({ variant = 'bar', compact = false }: { variant?: 'bar' | 'stack'; compact?: boolean }) {
  const {
    tabs,
    activeId,
    activateTab,
    closeTab,
    closeOthers,
    closeToTheRight,
    closeAll,
    floatTab,
    dockTab,
    dockAll,
    snapFloat,
    cycleFloating,
    reorderDocked,
  } = useWorkspaceTabs()
  const { appearance } = useTheme()
  const showTabIcons = appearance.chrome.tabIcons
  const navigate = useNavigate()
  const docked = tabs.filter((t) => t.mode === 'docked')
  const floating = tabs.filter((t) => t.mode === 'floating')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [menu, setMenu] = useState<TabMenuState | null>(null)
  const [listOpen, setListOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listBtnRef = useRef<HTMLButtonElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [listPos, setListPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeId, tabs.length])

  useLayoutEffect(() => {
    if (!listOpen) return
    const place = () => {
      const rect = listBtnRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(288, window.innerWidth - 16)
      const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8)
      setListPos({ top: Math.round(rect.bottom + 6), left: Math.round(left) })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [listOpen, compact, tabs.length])

  useEffect(() => {
    if (!listOpen) return
    const onDown = (event: Event) => {
      const target = event.target as Node
      if (listRef.current?.contains(target) || listBtnRef.current?.contains(target)) return
      setListOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setListOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [listOpen])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return
      close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [menu])

  const openMenu = (
    e: ReactMouseEvent,
    tabId: string,
    mode: 'docked' | 'floating',
    dockIndex: number,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    const pad = 8
    // Ancora logo abaixo da aba (não usa fixed dentro do header com backdrop-blur)
    const el = (e.currentTarget as HTMLElement).closest('[data-tab-id]') as HTMLElement | null
    const rect = el?.getBoundingClientRect()
    let x = rect ? rect.left : e.clientX
    let y = rect ? rect.bottom + 4 : e.clientY
    x = Math.min(Math.max(pad, x), window.innerWidth - TAB_MENU_W - pad)
    y = Math.min(Math.max(pad, y), window.innerHeight - TAB_MENU_H - pad)
    setMenu({
      tabId,
      mode,
      x,
      y,
      dockIndex,
      dockCount: docked.length,
    })
  }

  const run = (fn: () => void) => {
    fn()
    setMenu(null)
  }

  if (docked.length === 0 && floating.length === 0) return null
  if (!compact && variant !== 'stack' && docked.length <= 1 && floating.length === 0) return null

  const menuTab = menu ? tabs.find((t) => t.id === menu.tabId) : null
  const canCloseRight = menu?.mode === 'docked' && menu.dockIndex < menu.dockCount - 1
  const canCloseOthers = tabs.length > 1
  const stackedDocked =
    variant === 'stack'
      ? [
          ...docked.filter((tab) => tab.id !== activeId).slice(-2),
          ...docked.filter((tab) => tab.id === activeId),
        ]
      : docked

  const menuPortal =
    menu &&
    menuTab &&
    createPortal(
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-[200] min-w-[210px] overflow-hidden rounded-xl border border-ink-100 bg-surface py-1 shadow-xl"
        style={{ left: menu.x, top: menu.y, width: TAB_MENU_W }}
      >
        <p className="truncate border-b border-ink-50 px-3 py-1.5 text-[11px] font-semibold text-ink-500">
          {menuTab.title}
        </p>
        <TabMenuItem label="Ativar" onClick={() => run(() => activateTab(menu.tabId))} />
        <TabMenuItem
          label="Recarregar"
          onClick={() =>
            run(() => {
              activateTab(menu.tabId)
              navigate(0)
            })
          }
        />
        <div className="my-1 border-t border-ink-50" />
        {menu.mode === 'docked' ? (
          <TabMenuItem
            label="Flutuar janela"
            onClick={() => run(() => floatTab(menu.tabId))}
          />
        ) : (
          <>
            <TabMenuItem label="Encaixar" onClick={() => run(() => dockTab(menu.tabId))} />
            <TabMenuItem
              label="Maximizar"
              onClick={() => run(() => snapFloat(menu.tabId, 'maximize'))}
            />
            <TabMenuItem
              label="Metade esquerda"
              onClick={() => run(() => snapFloat(menu.tabId, 'left'))}
            />
            <TabMenuItem
              label="Metade direita"
              onClick={() => run(() => snapFloat(menu.tabId, 'right'))}
            />
            <TabMenuItem
              label="Encaixar todas as flutuantes"
              onClick={() => run(() => dockAll())}
            />
          </>
        )}
        <div className="my-1 border-t border-ink-50" />
        <TabMenuItem label="Fechar" onClick={() => run(() => closeTab(menu.tabId))} />
        <TabMenuItem
          label="Fechar outras"
          disabled={!canCloseOthers}
          onClick={() => run(() => closeOthers(menu.tabId))}
        />
        {menu.mode === 'docked' && (
          <TabMenuItem
            label="Fechar à direita"
            disabled={!canCloseRight}
            onClick={() => run(() => closeToTheRight(menu.tabId))}
          />
        )}
        <TabMenuItem label="Fechar todas" danger onClick={() => run(() => closeAll())} />
      </div>,
      document.body,
    )

  if (variant === 'stack') {
  return (
      <>
        {stackedDocked.map((tab, index) => {
          const isFront = index === stackedDocked.length - 1
          return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            draggable
            onDragStart={() => setDragIndex(docked.findIndex((item) => item.id === tab.id))}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              const to = docked.findIndex((item) => item.id === tab.id)
              if (dragIndex === null || dragIndex === to) return
              reorderDocked(dragIndex, to)
              setDragIndex(null)
            }}
            onContextMenu={(e) =>
              openMenu(e, tab.id, 'docked', docked.findIndex((item) => item.id === tab.id))
            }
            onDoubleClick={() => {
              if (window.matchMedia('(min-width: 768px)').matches) floatTab(tab.id)
            }}
            onClick={() => activateTab(tab.id)}
            className={`mona-stack__card ${activeId === tab.id ? 'is-active' : ''} ${isFront ? 'is-front' : ''}`}
            style={{ zIndex: 8 + index }}
            title="Clique para abrir · clique direito gerencia"
          >
            <i className="mona-stack__handle" aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-left">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  {showTabIcons &&
                    (() => {
                      const TabIcon = iconForPath(tab.path)
                      return <TabIcon size={14} className="shrink-0" strokeWidth={2} />
                    })()}
                  <span className="truncate">{tab.title}</span>
                </p>
                <p className="mt-1 truncate text-[11px] text-ink-500">
                  {activeId === tab.id ? 'Aberto agora' : 'Clique para voltar'}
                </p>
              </div>
              {docked.length > 1 && (
              <button
                type="button"
                className="shrink-0 rounded-full p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                aria-label={`Fechar ${tab.title}`}
              >
                <X size={14} />
              </button>
              )}
            </div>
          </div>
          )
        })}
        {floating.map((tab, index) => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onContextMenu={(e) => openMenu(e, tab.id, 'floating', -1)}
            className={`mona-stack__card is-float ${activeId === tab.id ? 'is-active' : ''}`}
            style={{ zIndex: stackedDocked.length + index + 1 }}
            onClick={() => activateTab(tab.id)}
          >
            <i className="mona-stack__handle" aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <button type="button" className="min-w-0 text-left" onClick={() => activateTab(tab.id)}>
                <p className="truncate text-sm font-semibold text-brand-900">{tab.title}</p>
                <p className="mt-1 text-[11px] text-brand-800">Janela flutuante</p>
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full px-2 py-1 text-[10px] text-brand-800 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation()
                  dockTab(tab.id)
                }}
              >
                Encaixar
              </button>
            </div>
          </div>
        ))}
        {menuPortal}
      </>
    )
  }

  const allTabs = [...docked, ...floating]
  const tabList =
    listOpen &&
    createPortal(
    <div
      ref={listRef}
      className={`mona-tablist${compact ? ' is-compact' : ''}`}
      role="listbox"
      aria-label="Abas abertas"
      style={{ top: listPos.top, left: listPos.left }}
    >
      {compact && <p className="mona-tablist__title">Abas abertas</p>}
      {allTabs.map((tab) => {
        const TabIcon = iconForPath(tab.path)
        return (
          <div key={tab.id} className={`mona-tablist__row ${tab.id === activeId ? 'is-active' : ''}`}>
            <button
              type="button"
              className="mona-tablist__open"
              onClick={() => {
                activateTab(tab.id)
                setListOpen(false)
              }}
            >
              <TabIcon size={14} strokeWidth={1.9} />
              <span className="truncate">{tab.title}</span>
              {tab.mode === 'floating' && <em>flutuante</em>}
            </button>
            <button
              type="button"
              className="mona-tablist__close"
              aria-label={`Fechar ${tab.title}`}
              onClick={() => closeTab(tab.id)}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
      {allTabs.length > 1 && (
        <button
          type="button"
          className="mona-tablist__all"
          onClick={() => {
            closeAll()
            setListOpen(false)
          }}
        >
          Fechar todas
        </button>
      )}
    </div>,
      document.body,
    )

  if (compact) {
    return (
      <div className="mona-tabbar is-compact">
        <button
          ref={listBtnRef}
          type="button"
          className={`mona-tabbar__folder${listOpen ? ' is-open' : ''}`}
          aria-expanded={listOpen}
          aria-haspopup="listbox"
          aria-label="Abas abertas"
          title="Abas abertas"
          onClick={() => setListOpen((open) => !open)}
        >
          <MonaFolder className="h-5 w-6" tone="purple" />
          {allTabs.length > 0 && <span>{allTabs.length}</span>}
        </button>
        {tabList}
        {menuPortal}
      </div>
    )
  }

  return (
    <div className="mona-tabbar">
      <div
        ref={scrollerRef}
        className="mona-tabbar__strip"
      >
        {docked.map((tab, index) => {
          const TabIcon = iconForPath(tab.path)
          return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragIndex === null || dragIndex === index) return
              reorderDocked(dragIndex, index)
              setDragIndex(null)
            }}
            onContextMenu={(e) => openMenu(e, tab.id, 'docked', index)}
            onDoubleClick={() => {
              if (window.matchMedia('(min-width: 768px)').matches) floatTab(tab.id)
            }}
            className={`mona-tab ${activeId === tab.id ? 'is-active' : ''}`}
            style={{ zIndex: activeId === tab.id ? docked.length + floating.length + 1 : docked.length - index }}
            title="Clique direito para gerenciar · arraste · duplo clique flutua"
          >
            <TabShape />
            {showTabIcons && <TabIcon size={13} className="shrink-0" strokeWidth={1.9} />}
            <button
              type="button"
              className="mona-tab__label"
              onClick={() => activateTab(tab.id)}
              onContextMenu={(e) => openMenu(e, tab.id, 'docked', index)}
            >
              {tab.title}
            </button>
            <button
              type="button"
              className="mona-tab__float"
              title="Flutuar"
              onClick={() => floatTab(tab.id)}
            >
              <LayoutPanelTop size={12} />
            </button>
            <button
              type="button"
              className="mona-tab__close"
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              aria-label={`Fechar ${tab.title}`}
            >
              <X size={14} />
            </button>
          </div>
          )
        })}
        {floating.map((tab) => {
          const TabIcon = iconForPath(tab.path)
          return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onContextMenu={(e) => openMenu(e, tab.id, 'floating', -1)}
            className={`mona-tab is-float ${activeId === tab.id ? 'is-active' : ''}`}
            style={{ zIndex: activeId === tab.id ? docked.length + floating.length + 1 : 0 }}
            title="Clique direito para gerenciar janela flutuante"
          >
            <TabShape />
            {showTabIcons ? (
              <TabIcon size={13} className="shrink-0 text-brand-800" strokeWidth={1.9} />
            ) : (
              <LayoutPanelTop size={12} className="shrink-0 text-brand-800" />
            )}
            <button
              type="button"
              className="max-w-[88px] truncate text-brand-900 sm:max-w-[120px]"
              onClick={() => activateTab(tab.id)}
              onContextMenu={(e) => openMenu(e, tab.id, 'floating', -1)}
            >
              {tab.title}
            </button>
            <button
              type="button"
              className="shrink-0 rounded px-1 text-[10px] text-brand-800 hover:bg-white"
              title="Encaixar"
              onClick={() => dockTab(tab.id)}
            >
              Encaixar
            </button>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-ink-500 hover:bg-white hover:text-red-600"
              onClick={() => closeTab(tab.id)}
              aria-label={`Fechar ${tab.title}`}
            >
              <X size={14} />
            </button>
          </div>
          )
        })}
      </div>

      <button
        type="button"
        className="mona-tabbar__new"
        aria-label="Abrir módulos"
        title="Abrir módulos em uma aba"
        onClick={() => navigate('/mais')}
      >
        <Plus size={17} strokeWidth={1.9} />
      </button>

      {!compact && floating.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-ink-100 sm:border-l sm:pl-2">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-[11px] text-ink-600 hover:bg-white"
            title="Trocar janela flutuante"
            onClick={() => cycleFloating(1)}
          >
            Trocar
          </button>
          <button
            type="button"
            className="hidden rounded-lg px-2 py-1 text-[11px] text-ink-600 hover:bg-white sm:inline"
            title="Metade esquerda"
            onClick={() => {
              const t = floating.find((f) => f.id === activeId) || floating[0]
              if (t) snapFloat(t.id, 'left')
            }}
          >
            ◧
          </button>
          <button
            type="button"
            className="hidden rounded-lg px-2 py-1 text-[11px] text-ink-600 hover:bg-white sm:inline"
            title="Metade direita"
            onClick={() => {
              const t = floating.find((f) => f.id === activeId) || floating[0]
              if (t) snapFloat(t.id, 'right')
            }}
          >
            ◨
          </button>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-[11px] text-ink-600 hover:bg-white"
            title="Maximizar"
            onClick={() => {
              const t = floating.find((f) => f.id === activeId) || floating[0]
              if (t) snapFloat(t.id, 'maximize')
            }}
          >
            □
          </button>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-[11px] font-medium text-brand-800 hover:bg-white"
            onClick={() => dockAll()}
          >
            Encaixar todas
          </button>
        </div>
      )}

      <div className="relative flex shrink-0 items-center gap-1">
        <button
          ref={listBtnRef}
          type="button"
          className="mona-tabbar__more"
          aria-expanded={listOpen}
          aria-haspopup="listbox"
          title="Ver abas"
          onClick={() => setListOpen((open) => !open)}
        >
          <SquareStack size={16} strokeWidth={1.9} />
          {allTabs.length > 1 && <span>{allTabs.length}</span>}
        </button>
        {tabList}
      </div>

      {menuPortal}
    </div>
  )
}

function dayKey(value: string | undefined, tz: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-CA', { timeZone: tz })
}

function clampQuickPanelWidth(value: number) {
  return Math.min(420, Math.max(236, value))
}

function QuickAccessPanel({
  width,
  onWidthChange,
  onClose,
}: {
  width: number
  onWidthChange: (width: number) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { hasPermission } = usePermissions()
  const { preferences, saveTravel, browserTimeZone } = useUserPreferences()
  const [now, setNow] = useState(() => new Date())
  const [doneIds, setDoneIds] = useState<string[]>([])
  const [widgets, setWidgets] = useState<QuickWidget[]>(readQuickWidgets)
  const [editing, setEditing] = useState(false)
  const canSeeClients = hasPermission(Permissions.ClientsRead)
  const tz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const homeTz = preferences?.homeTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const away =
    Boolean(preferences?.isAwayFromHome) ||
    Boolean(browserTimeZone && homeTz && browserTimeZone !== homeTz && !preferences?.travelModeEnabled)

  const { data: todos = [], isLoading: todosLoading, isError: todosError } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get<TodoItem[]>('/todos'),
  })
  const { data: events = [], isLoading: eventsLoading, isError: eventsError } = useQuery({
    queryKey: ['agenda-events', tz],
    queryFn: () =>
      api.get<AgendaEvent[]>(`/agenda/events?displayTimeZoneId=${encodeURIComponent(tz)}`),
  })
  const { data: clients = [], isLoading: clientsLoading, isError: clientsError } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api.get<Client[]>('/clients'),
    enabled: canSeeClients,
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    window.localStorage.setItem(QUICK_PANEL_WIDGETS_KEY, JSON.stringify(widgets))
  }, [widgets])

  const completeTodo = useMutation({
    mutationFn: (id: string) => api.patch(`/todos/${id}`, { status: 'Done' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const today = dayKey(now.toISOString(), tz)
  const todosUnavailable = todosLoading || todosError
  const eventsUnavailable = eventsLoading || eventsError
  const clientsUnavailable = clientsLoading || clientsError
  const openTodos = todos
    .filter((todo) => todo.status !== 'Done' || doneIds.includes(todo.id))
    .filter((todo) => dayKey(todo.dueAtUtc || todo.dueAtLocal, tz) === today)
  const todayEvents = events
    .filter((event) => dayKey(event.startAtUtc || event.startAt, tz) === today)
    .sort((a, b) => new Date(a.startAtUtc || a.startAt).getTime() - new Date(b.startAtUtc || b.startAt).getTime())
  const priorityClients = clients
    .filter((client) => client.status === 'Notice' || client.status === 'Hold' || client.needsQuickResponse)
    .concat(clients.filter((client) => client.status === 'Active' && !client.needsQuickResponse))
    .filter((client, index, list) => list.findIndex((item) => item.id === client.id) === index)

  const dateText = now.toLocaleDateString('pt-BR', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' })
  const displayDate = dateText[0].toUpperCase() + dateText.slice(1)
  const widgetOptions: { id: QuickWidgetId; label: string; icon: LucideIcon }[] = [
    { id: 'todos', label: 'Tarefas', icon: CheckSquare },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'overview', label: 'Resumo', icon: BarChart3 },
  ]

  const moveWidget = (id: QuickWidgetId, direction: -1 | 1) => {
    setWidgets((current) => {
      const index = current.findIndex((widget) => widget.id === id)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
      return next
    })
  }

  return (
    <section className="mona-quick" style={{ '--mona-quick-w': `${width}px` } as CSSProperties}>
      <header className="mona-quick__header">
        <div className="mona-quick__date">
          <CalendarDays size={23} />
          <div><h2>Hoje</h2><p>{displayDate}</p></div>
        </div>
        <div className="mona-quick__actions">
          <button
            type="button"
            className={`mona-icon-btn ${editing ? 'is-active' : ''}`}
            aria-label={editing ? 'Concluir edição do painel' : 'Personalizar painel'}
            title={editing ? 'Concluir edição' : 'Personalizar painel'}
            aria-pressed={editing}
            onClick={() => setEditing((value) => !value)}
          >
            {editing ? <CheckSquare size={17} /> : <SlidersHorizontal size={17} />}
          </button>
          <button type="button" className="mona-icon-btn" aria-label="Fechar painel rápido" title="Fechar" onClick={onClose}>
            <ChevronsRight size={17} />
          </button>
        </div>
      </header>

      {editing && (
        <div className="mona-quick__editor" aria-label="Personalização do painel">
          <p>Janelas do painel</p>
          {widgets.map((widget, index) => {
            const option = widgetOptions.find((item) => item.id === widget.id)!
            const Icon = option.icon
            return (
              <div className="mona-quick__editor-row" key={widget.id}>
                <label>
                  <input
                    type="checkbox"
                    className="mona-check__input"
                    checked={widget.visible}
                    onChange={(event) => setWidgets((current) => current.map((item) => item.id === widget.id ? { ...item, visible: event.target.checked } : item))}
                  />
                  <Icon size={15} />
                  <span>{option.label}</span>
                </label>
                <button
                  type="button"
                  className="mona-quick__edit-icon"
                  aria-label={`${widget.size === 'compact' ? 'Expandir' : 'Compactar'} ${option.label}`}
                  title={widget.size === 'compact' ? 'Expandir janela' : 'Compactar janela'}
                  onClick={() => setWidgets((current) => current.map((item) => item.id === widget.id ? { ...item, size: item.size === 'compact' ? 'expanded' : 'compact' } : item))}
                >
                  <Maximize2 size={14} />
                </button>
                <button type="button" className="mona-quick__edit-icon" aria-label={`Mover ${option.label} para cima`} disabled={index === 0} onClick={() => moveWidget(widget.id, -1)}><ArrowUp size={14} /></button>
                <button type="button" className="mona-quick__edit-icon" aria-label={`Mover ${option.label} para baixo`} disabled={index === widgets.length - 1} onClick={() => moveWidget(widget.id, 1)}><ArrowDown size={14} /></button>
              </div>
            )
          })}
        </div>
      )}

      {editing && <div className="mona-quick__resize">
        <Maximize2 size={14} />
        <input
          type="range"
          min={236}
          max={420}
          step={4}
          value={width}
          aria-label="Largura do painel rápido"
          onChange={(event) => onWidthChange(clampQuickPanelWidth(Number(event.target.value)))}
        />
      </div>}

      <div className="mona-quick__body">
        {widgets.filter((widget) => widget.visible).map((widget) => (
          <section key={widget.id} className={`mona-quick__screen is-${widget.size}`} aria-label={widgetOptions.find((item) => item.id === widget.id)?.label}>
            {widget.id === 'todos' && <>
            <div className="mona-day__head">
              <span>
                <CheckSquare size={15} strokeWidth={2} />
                Tarefas do dia
              </span>
              <button type="button" aria-label="Abrir tarefas" title="Abrir tarefas" onClick={() => navigate('/todos')}><ExternalLink size={14} /></button>
            </div>
            <strong className="mona-quick__metric">{todosUnavailable ? '—' : openTodos.length} <small>abertas</small></strong>
            {todosUnavailable || openTodos.length === 0 ? <div className="mona-quick__empty-state"><ListChecks size={42} /><strong>{todosLoading ? 'Carregando tarefas' : todosError ? 'Tarefas indisponíveis' : 'Nada pendente para hoje'}</strong><span>{todosLoading ? 'Aguarde um instante.' : todosError ? 'Não foi possível carregar.' : 'Tudo em dia!'}</span></div> : <ul className="mona-day__list">
              {openTodos.slice(0, widget.size === 'compact' ? 1 : 5).map((todo) => (
                <li key={todo.id} className="mona-day__task">
                  <div className="mona-checklist">
                    <input
                      id={`dock-todo-${todo.id}`}
                      type="checkbox"
                      checked={doneIds.includes(todo.id) || todo.status === 'Done'}
                      onChange={(event) => {
                        if (!event.target.checked || doneIds.includes(todo.id)) return
                        setDoneIds((ids) => [...ids, todo.id])
                        window.setTimeout(() => completeTodo.mutate(todo.id), 520)
                      }}
                    />
                    <label htmlFor={`dock-todo-${todo.id}`}>{todo.title}</label>
                  </div>
                  {todo.isOverdue && !doneIds.includes(todo.id) && <em>atrasada</em>}
                </li>
              ))}
            </ul>}
            {widget.size === 'expanded' && !todosUnavailable && openTodos.length > 0 && <button type="button" className="mona-quick__cta" onClick={() => navigate('/todos')}><ExternalLink size={15} />Ver tarefas</button>}
            </>}

            {widget.id === 'agenda' && <>
            <div className="mona-day__head">
              <span>
                <CalendarDays size={15} strokeWidth={2} />
                Agenda do dia
              </span>
              <button type="button" aria-label="Abrir agenda" title="Abrir agenda" onClick={() => navigate('/agenda')}><ExternalLink size={14} /></button>
            </div>
            <strong className="mona-quick__metric">{eventsUnavailable ? '—' : todayEvents.length} <small>{todayEvents.length === 1 ? 'evento hoje' : 'eventos hoje'}</small></strong>
            <ul className="mona-day__list mona-quick__timeline">
              {(eventsUnavailable || todayEvents.length === 0) && <li className="mona-day__empty">{eventsLoading ? 'Carregando agenda' : eventsError ? 'Não foi possível carregar a agenda' : 'Sem compromissos hoje'}</li>}
              {!eventsUnavailable && todayEvents.slice(widget.size === 'compact' ? -1 : -3).map((event) => (
                <li key={event.id}>
                  <button type="button" className="mona-quick__event-row" onClick={() => navigate('/agenda')}>
                    <span className="mona-quick__event-time">
                      {new Date(event.startAtUtc || event.startAt).toLocaleTimeString('pt-BR', {
                        timeZone: tz,
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="mona-quick__event-dot" />
                    <span className="mona-quick__event-copy"><strong>{event.title}</strong><small>{event.clientName || event.categoryName || 'Compromisso'}</small></span>
                  </button>
                </li>
              ))}
            </ul>
            {widget.size === 'expanded' && <button type="button" className="mona-quick__cta" onClick={() => navigate('/agenda')}>Ver agenda completa <ArrowRight size={15} /></button>}
        {widget.size === 'expanded' && (preferences?.travelModeEnabled ? (
          <button
            type="button"
            className="mona-pin__action"
            onClick={() => void saveTravel({ travelModeEnabled: false })}
          >
            Voltar ao fuso casa
          </button>
        ) : away && browserTimeZone ? (
          <button
            type="button"
            className="mona-pin__action"
              onClick={() =>
              void saveTravel({
                detectedTimeZoneId: browserTimeZone,
                travelModeEnabled: true,
                travelTimeZoneId: browserTimeZone,
                travelLabel: browserTimeZone,
              })
            }
          >
            Usar fuso local
          </button>
        ) : null)}
            </>}

            {widget.id === 'clients' && <>
            <div className="mona-day__head">
              <span>
                <Users size={15} strokeWidth={2} />
                Clientes
              </span>
              {canSeeClients && <button type="button" aria-label="Abrir clientes" title="Abrir clientes" onClick={() => navigate('/clientes')}><ExternalLink size={14} /></button>}
            </div>
            <strong className="mona-quick__metric">{canSeeClients && !clientsUnavailable ? clients.length : '—'} <small>{canSeeClients ? 'na carteira' : 'sem acesso'}</small></strong>
            {canSeeClients && !clientsUnavailable && widget.size === 'compact' && <div className="mona-quick__client-avatars">
              {clients.slice(0, 3).map((client) => <button key={client.id} type="button" title={client.name} aria-label={`Abrir ${client.name}`} onClick={() => navigate(`/clientes/${client.id}`)}>{client.name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}</button>)}
              <button type="button" title="Ver todos os clientes" aria-label="Ver todos os clientes" onClick={() => navigate('/clientes')}><Plus size={14} /></button>
            </div>}
            {widget.size === 'expanded' && <ul className="mona-day__list">
              {!canSeeClients && <li className="mona-day__empty">Seu acesso atual não inclui clientes.</li>}
              {canSeeClients && clientsLoading && <li className="mona-day__empty">Carregando clientes.</li>}
              {canSeeClients && clientsError && <li className="mona-day__empty">Não foi possível carregar clientes.</li>}
              {canSeeClients && !clientsUnavailable && priorityClients.length === 0 && <li className="mona-day__empty">Nenhum cliente em destaque.</li>}
              {!clientsUnavailable && priorityClients.slice(0, 6).map((client) => (
                <li key={client.id}>
                  <button type="button" className="mona-client-peek" onClick={() => navigate(`/clientes/${client.id}`)}>
                    <span className="mona-client-peek__main">
                      <strong>{client.name}</strong>
                      <small>{client.companyName || client.segment || client.email || 'Cliente'}</small>
                    </span>
                    <span className="mona-client-peek__meta">
                      <StatusDot status={client.status} />
                      {client.needsQuickResponse ? 'Atenção' : getStatusLabel(client.status)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>}
            {canSeeClients && <button type="button" className="mona-quick__footer-link" onClick={() => navigate('/clientes')}>
              <Users size={15} />
              Ver todos os clientes <ArrowRight size={15} />
            </button>}
            </>}
            {widget.id === 'overview' && <>
              <div className="mona-day__head"><span><BarChart3 size={15} />Resumo do dia</span></div>
              <div className="mona-quick__overview">
                <div><strong>{todosUnavailable ? '—' : openTodos.length}</strong><span>Tarefas abertas</span></div>
                <div><strong>{eventsUnavailable ? '—' : todayEvents.length}</strong><span>Eventos hoje</span></div>
                {canSeeClients && <div><strong>{clientsUnavailable ? '—' : priorityClients.filter((client) => client.needsQuickResponse).length}</strong><span>Clientes em atenção</span></div>}
              </div>
            </>}
          </section>
        ))}
        {!widgets.some((widget) => widget.visible) && <p className="mona-quick__empty">Nenhuma janela selecionada. Use Personalizar painel para adicionar uma.</p>}
      </div>
    </section>
  )
}

function UserMenu({
  name,
  role,
  initials,
  unread,
  onLogout,
}: {
  name?: string
  role: string
  initials: string
  unread: number
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 8 })
  const navigate = useNavigate()

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const place = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const width = 256
      const right = Math.min(Math.max(8, window.innerWidth - rect.right), window.innerWidth - width - 8)
      const top = Math.min(rect.bottom + 10, window.innerHeight - 8)
      setMenuPos({ top: Math.round(top), right: Math.round(right) })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="flex items-center gap-2 rounded-full p-1 sm:gap-2.5 sm:py-1 sm:pl-1 sm:pr-2.5"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="mona-avatar flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9">
          {initials}
        </div>
        <div className="hidden min-w-0 leading-tight sm:block">
          <p className="truncate text-sm font-semibold text-ink-900">{name?.split(' ')[0]}</p>
        </div>
        <ChevronDown
          size={14}
          className={`hidden text-ink-500 transition sm:block ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[220] w-64 overflow-hidden rounded-3xl border border-ink-100 bg-white py-2 shadow-xl"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          <div className="px-4 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
            <p className="text-xs text-ink-500">{role}</p>
          </div>
          <div className="my-1 h-px bg-ink-100" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => toggleTheme()}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => go('/notificacoes')}
          >
            <Bell size={16} />
            <span className="flex-1">Central de alertas</span>
            {unread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => go('/chat')}
          >
            <MessageSquare size={16} />
            Chat interno
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => go('/configuracoes')}
          >
            <Settings size={16} />
            Configurações
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => {
              setOpen(false)
              reopenPageTutorial()
            }}
          >
            <HelpCircle size={16} />
            Tutorial desta página
          </button>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => setOpen(false)}
          >
            <MessageSquare size={16} />
            Central de ajuda
          </a>
          <div className="my-1 h-px bg-ink-100" />
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

function TabMenuItem({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full px-3 py-1.5 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-ink-800 hover:bg-brand-50 hover:text-brand-900'
      }`}
    >
      {label}
    </button>
  )
}

function MobilePathBar() {
  return (
    <div className="mona-pathbar">
      <WorkspaceTabBar compact />
    </div>
  )
}

function AppShell() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const embed = searchParams.get('embed') === '1'
  const { preferences } = useUserPreferences()
  const { notifications, unread, markRead, markAll } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  })
  const [quickPanelOpen, setQuickPanelOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    if (window.innerWidth >= 768 && window.innerWidth < 1024) return false
    return window.localStorage.getItem(QUICK_PANEL_OPEN_KEY) !== '0'
  })
  const narrowDesktopRef = useRef(typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024)
  const [quickPanelWidth, setQuickPanelWidth] = useState(() => {
    if (typeof window === 'undefined') return 280
    return clampQuickPanelWidth(Number(window.localStorage.getItem(QUICK_PANEL_WIDTH_KEY)) || 280)
  })
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(NAV_GROUPS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) return parsed.filter((id): id is string => typeof id === 'string')
      }
    } catch {
      /* keep default */
    }
    return []
  })
  const [fanGroupId, setFanGroupId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMobile) localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed, isMobile])

  useEffect(() => {
    if (!isMobile) window.localStorage.setItem(QUICK_PANEL_OPEN_KEY, quickPanelOpen ? '1' : '0')
  }, [quickPanelOpen, isMobile])

  useEffect(() => {
    if (!isMobile) window.localStorage.setItem(QUICK_PANEL_WIDTH_KEY, String(quickPanelWidth))
  }, [quickPanelWidth, isMobile])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      const narrowDesktop = !mobile && window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
      if (narrowDesktop && !narrowDesktopRef.current) setQuickPanelOpen(false)
      narrowDesktopRef.current = narrowDesktop
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const allowedNav = useMemo(
    () =>
      NAV_DEFINITIONS.filter((item) => {
        if (item.ownerOnly && !user?.isOwner) return false
        if (!item.permission) return true
        return hasPermission(item.permission)
      }),
    [hasPermission, user?.isOwner],
  )

  const visibleNav = useMemo(
    () => resolveMenu(preferences?.menuItems, allowedNav),
    [preferences?.menuItems, allowedNav],
  )

  const sections = useMemo(() => groupedNav(visibleNav), [visibleNav])
  const chatNav = visibleNav.find((item) => item.key === 'chat')
  const activeGroupId = navGroupIdForPath(location.pathname)

  useEffect(() => {
    if (!activeGroupId) return
    setOpenGroups((prev) => {
      if (prev.includes(activeGroupId)) return prev
      const next = [...prev, activeGroupId]
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next))
      return next
    })
  }, [activeGroupId])

  useEffect(() => {
    if (!isMobile) return
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelector('.mona-sidebar.is-mobile-dock .is-notch-item')
        ?.closest('.group, .mona-fan, li')
        ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isMobile, location.pathname])

  const isGroupOpen = (groupId: string, collapsible: boolean) => {
    if (!collapsible) return true
    return openGroups.includes(groupId)
  }

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    setFanGroupId(null)
  }, [location.pathname, collapsed])

  useEffect(() => {
    if (!fanGroupId) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        target instanceof Element &&
        target.closest('.mona-fan, .mona-fan__list, .mona-sidebar__more')
      ) {
        return
      }
      setFanGroupId(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFanGroupId(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [fanGroupId])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'M'

  if (embed) {
    return (
      <div className="min-h-screen bg-ink-50 p-4">
        <Outlet />
      </div>
    )
  }

  const railW = isMobile ? 0 : collapsed ? 68 : 216
  const contentMargin = isMobile ? 0 : 12 + railW + 12
  const compactRail = isMobile || collapsed
  const brandH = isMobile ? 0 : compactRail ? 64 : 66
  const mobileDockH = 72
  const dockColumnW = quickPanelWidth

  return (
    <div className={`mona-shell ${isMobile ? 'is-mobile' : ''}`}>
      <aside
        ref={sidebarRef}
        className={`mona-sidebar fixed z-30 flex overflow-visible ${
          isMobile ? 'is-mobile-dock is-compact' : compactRail ? 'is-compact flex-col' : 'flex-col'
        }`}
        style={
          isMobile
            ? { top: 'auto', right: 0, bottom: 0, left: 0, height: mobileDockH, width: 'auto' }
            : { top: 12, bottom: 12, left: 12, width: railW }
        }
      >
        <SidebarIndicator
          enabled
          layout={compactRail ? 'compact' : 'full'}
          orientation={isMobile ? 'horizontal' : 'vertical'}
          tick={`${openGroups.join(',')}|${fanGroupId ?? ''}|${isMobile ? 'm' : 'd'}`}
        />
        {!isMobile && (
          <NavLink
            to="/"
            end
            className={`mona-brand ${compactRail ? 'is-compact' : 'is-wide'}`}
            style={{ height: brandH }}
            aria-label="MONA"
            title="MONA"
          >
            <BrandMark compact={compactRail} />
            {import.meta.env.VITE_FAKE_API === '1' && !compactRail && (
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700">Fake</span>
            )}
          </NavLink>
        )}
        {!isMobile && (
          <div className={`relative z-[3] flex shrink-0 items-center ${compactRail ? 'justify-center pt-3' : 'justify-end px-3 pt-3'}`}>
            {compactRail ? (
            <button
              type="button"
                className="rounded-full p-2 text-ink-700 hover:bg-white/40"
              title="Expandir menu"
              aria-label="Expandir menu"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <button
              type="button"
                className="rounded-full p-1.5 text-ink-500 hover:bg-white/40"
              title="Recolher menu"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>
        )}
        <nav className="mona-sidebar__nav min-h-0 flex-1">
          {compactRail ? (
            <div className="mona-sidebar__compact">
              {isMobile ? (
                <>
                  {sections.map((section) =>
                    section.collapsible ? (
                      <CompactGroupFan
                        key={section.id}
                        label={section.label}
                        icon={section.icon}
                        items={section.items}
                        open={fanGroupId === section.id}
                        onToggle={() => setFanGroupId((id) => (id === section.id ? null : section.id))}
                        onNavigate={() => setFanGroupId(null)}
                        upward
                        caption
                      />
                    ) : (
                      <ul key={section.id}>
                        {section.items.map((item) => (
                          <li key={item.key} onClick={() => setFanGroupId(null)}>
                            <SidebarLink
                              to={item.to}
                              end={item.to === '/'}
                              icon={item.icon}
                              label={item.label}
                              compact
                              caption
                            />
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                  {chatNav && (
                    <div className="group" onClick={() => setFanGroupId(null)}>
                      <SidebarLink to={chatNav.to} icon={chatNav.icon} label="Chat" compact caption />
                    </div>
                  )}
                </>
              ) : (
                sections.map((section) =>
                  section.collapsible ? (
                    <CompactGroupFan
                      key={section.id}
                      label={section.label}
                      icon={section.icon}
                      items={section.items}
                      open={fanGroupId === section.id}
                      onToggle={() => setFanGroupId((id) => (id === section.id ? null : section.id))}
                      onNavigate={() => setFanGroupId(null)}
                    />
                  ) : (
                    <ul key={section.id}>
                      {section.items.map((item) => (
                        <li key={item.key}>
                          <SidebarLink
                            to={item.to}
                            end={item.to === '/'}
                            icon={item.icon}
                            label={item.label}
                            compact
                          />
                        </li>
                      ))}
                    </ul>
                  ),
                )
              )}
            </div>
          ) : (
            <>
              {sections.map((section) => {
                const open = isGroupOpen(section.id, section.collapsible)
                const GroupIcon = section.icon
                  return (
                  <div key={section.id} className="mona-sidebar__group">
                    {section.collapsible ? (
                      <button
                        type="button"
                        className="mona-sidebar__group-toggle"
                        aria-expanded={open}
                        aria-label={`${section.label}, grupo com ${section.items.length} itens`}
                        onClick={() => toggleGroup(section.id)}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <GroupIcon size={14} strokeWidth={2} />
                          {section.label}
                      </span>
                        <span className="mona-sidebar__group-meta">
                          <span className="mona-sidebar__group-count">{section.items.length}</span>
                          <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
                        </span>
                      </button>
                    ) : (
                      <p className="mona-sidebar__group-label">
                        <span className="flex min-w-0 items-center gap-2">
                          <GroupIcon size={14} strokeWidth={2} />
                          {section.label}
                      </span>
                      </p>
                    )}
                    <div className={`mona-sidebar__group-panel ${open ? 'is-open' : ''}`}>
                      <ul>
                        {section.items.map((item) => (
                  <li key={item.key}>
                            <SidebarLink
                              to={item.to}
                              end={item.to === '/'}
                              icon={item.icon}
                              label={item.label}
                            />
                  </li>
                        ))}
          </ul>
            </div>
                </div>
                )
              })}
            </>
            )}
        </nav>
        {!isMobile && hasPermission(Permissions.TodosWrite) && (
          <div className={`relative z-[3] shrink-0 ${compactRail ? 'px-2 pb-2 pt-3' : 'px-3 pb-2 pt-3'}`}>
            <button
              type="button"
              className={`mona-sidebar__cta ${compactRail ? 'px-0' : ''}`}
              onClick={() => navigate('/todos?novo=1')}
              title="Nova tarefa"
            >
              <Plus size={16} strokeWidth={2.4} />
              {!compactRail && 'Nova tarefa'}
            </button>
          </div>
        )}
      </aside>
      <div
        className={`mona-canvas min-w-0 flex-1 transition-[margin] ${quickPanelOpen ? 'has-quick-panel' : 'is-quick-closed'} ${isMobile ? '' : 'my-3 mr-3'}`}
        style={{
          marginLeft: contentMargin,
          marginRight: isMobile ? 0 : undefined,
          marginTop: isMobile ? 0 : undefined,
          '--mona-dock-w': `${dockColumnW}px`,
        } as CSSProperties}
      >
        <section className="mona-workspace">
          <header className="mona-topbar">
            {isMobile ? (
              <>
                <div className="mona-topbar__row">
                  <NavLink to="/" end className="mona-topbar__logo" aria-label="MONA">
                    <BrandLogo size={26} showWordmark wordAsText title="MONA" />
                  </NavLink>
                  <div className="mona-topbar__search">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={15} />
                    <input
                      type="search"
                      placeholder="Buscar..."
                      className="mona-search"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const q = (e.target as HTMLInputElement).value.trim()
                          if (q) navigate(`/clientes?q=${encodeURIComponent(q)}`)
                        }
                      }}
                    />
            </div>
                  <MobilePathBar />
              <button
                type="button"
                    className="mona-icon-btn relative"
                    aria-label="Notificações"
                    onClick={() => setNotifOpen((v) => !v)}
                  >
                    <Bell size={18} />
                    {unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread}
              </span>
                    )}
                  </button>
                  {notifOpen &&
                    createPortal(
                    <div className="fixed right-3 top-16 z-[220] w-[min(24rem,calc(100vw-1.5rem))] rounded-3xl border border-ink-100 bg-white p-3 shadow-xl">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink-900">Alertas</p>
                        <button type="button" className="text-xs text-brand-800" onClick={() => markAll()}>
                          Marcar vistas
                        </button>
        </div>
                      <ul className="max-h-80 space-y-2 overflow-y-auto">
                        {notifications.length === 0 && (
                          <li className="py-6 text-center text-sm text-ink-500">Nenhuma notificação</li>
                        )}
                        {notifications.slice(0, 8).map((n) => (
                          <li key={n.id}>
              <button
                type="button"
                              className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${n.isRead ? 'bg-ink-50/50' : 'bg-brand-50'}`}
                              onClick={() => {
                                markRead(n.id)
                                if (n.link) navigate(n.link)
                                setNotifOpen(false)
                              }}
                            >
                              <p className="font-medium text-ink-900">{n.title}</p>
                              <p className="text-xs text-ink-600">{n.body}</p>
              </button>
                          </li>
                        ))}
                      </ul>
                    </div>,
                    document.body,
                    )}
                  <UserMenu
                    name={user?.name}
                    role={user?.isOwner ? 'Conta principal' : 'Usuário compartilhado'}
                    initials={initials}
                    unread={unread}
                    onLogout={() => void handleLogout()}
                  />
                </div>
              </>
            ) : (
            <div className="flex min-w-0 items-center gap-2 px-3 py-2 sm:px-4">
              <div className="min-w-0 flex-1">
                <WorkspaceTabBar />
              </div>
              <div className="mona-topbar__search">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={15} />
              <input
                type="search"
                placeholder="Buscar..."
                  className="mona-search"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value.trim()
                    if (q) navigate(`/clientes?q=${encodeURIComponent(q)}`)
                  }
                }}
              />
            </div>
            </div>
            )}
          </header>

          <main className={`mona-canvas__main ${isMobile ? 'px-[0.85rem] pb-20 pt-1.5' : 'px-3 pb-6 pt-3 sm:px-6 sm:pt-4 lg:px-8'}`}>
            <Outlet />
          </main>
        </section>

        {!isMobile && !quickPanelOpen && (
          <button
            type="button"
            className="mona-quick-float"
            aria-label="Abrir painel rápido"
            title="Abrir painel rápido"
            onClick={() => setQuickPanelOpen(true)}
          >
            <LayoutPanelTop size={18} />
            <span>Painel</span>
          </button>
        )}

        {!isMobile && quickPanelOpen && (
        <aside className="mona-dock">
          <div className="mona-panel mona-panel--tools">
              <button
                type="button"
              className="mona-icon-btn"
                aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                onClick={() => toggleTheme()}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
              className="mona-icon-btn relative"
                aria-label="Notificações"
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </button>
              {notifOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-3xl border border-ink-100 bg-white p-3 shadow-xl">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink-900">Alertas</p>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs text-brand-800" onClick={() => markAll()}>
                        Marcar vistas
                      </button>
                      <button
                        type="button"
                        className="text-xs text-ink-500"
                        onClick={() => {
                          setNotifOpen(false)
                          navigate('/notificacoes')
                        }}
                      >
                        Gerenciar
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-80 space-y-2 overflow-y-auto">
                    {notifications.length === 0 && (
                      <li className="py-6 text-center text-sm text-ink-500">Nenhuma notificação</li>
                    )}
                    {notifications.slice(0, 8).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                        className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${n.isRead ? 'bg-ink-50/50' : 'bg-brand-50'}`}
                          onClick={() => {
                            markRead(n.id)
                            if (n.link) navigate(n.link)
                            setNotifOpen(false)
                          }}
                        >
                          <p className="font-medium text-ink-900">{n.title}</p>
                          <p className="text-xs text-ink-600">{n.body}</p>
                          <p className="mt-1 text-[11px] text-ink-500">
                            {new Date(n.occursAtLocal).toLocaleString('pt-BR')}
                            {n.resolutionStatus ? ` · ${n.resolutionStatus}` : ''}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            <UserMenu
              name={user?.name}
              role={user?.isOwner ? 'Conta principal' : 'Usuário compartilhado'}
              initials={initials}
              unread={unread}
              onLogout={() => void handleLogout()}
            />
                </div>
            <QuickAccessPanel
              width={quickPanelWidth}
              onWidthChange={setQuickPanelWidth}
              onClose={() => setQuickPanelOpen(false)}
            />
        </aside>
        )}
      </div>

      <FloatingTabsLayer />
      <PageTutorialHost />
      <ChatWidget />
    </div>
  )
}

export function AppLayout() {
  return (
    <WorkspaceTabsProvider>
      <AppShell />
    </WorkspaceTabsProvider>
  )
}
