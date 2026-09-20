import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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
  GripVertical,
  X,
  MessageSquare,
  LayoutPanelTop,
  Moon,
  Sun,
  Plus,
  ChevronDown,
  CalendarDays,
  CheckSquare,
  SquareStack,
  LayoutGrid,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../shared/api/client'
import type { AgendaEvent, TodoItem } from '../shared/types'
import { useAuth } from '../shared/auth/AuthContext'
import { useTheme } from '../shared/theme/ThemeContext'
import { iconForPath } from '../shared/theme/tabIcon'
import { usePermissions } from '../shared/permissions/hooks'
import {
  NAV_DEFINITIONS,
  groupedNav,
  mobileMoreSections,
  mobileTabs,
  navGroupIdForPath,
  resolveMenu,
  type NavDefinition,
} from '../shared/nav/navConfig'
import { useNotifications, useUserPreferences } from '../shared/hooks/useWorkspaceData'
import { WorkspaceTabsProvider, useWorkspaceTabs } from './WorkspaceTabsContext'
import { FloatingTabsLayer } from './FloatingTabsLayer'
import { ChatWidget } from '../features/chat/ChatWidget'
import type { LucideIcon } from 'lucide-react'
import { BrandLogo, MonaFolder } from '../shared/ui'

const WHATSAPP_URL = 'https://wa.me/5511999999999'
const SIDEBAR_KEY = 'fatto_sidebar_collapsed'
const NAV_GROUPS_KEY = 'mona_nav_groups_v1'
const FAN_COLORS = ['#F54D7D', '#582B86', '#8B4BB8', '#FF7A33', '#C45BA8']

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

function BrandMark({ compact }: { compact?: boolean }) {
  return <BrandLogo size={compact ? 48 : 42} showWordmark={!compact} title="MONA" />
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
  return (
    <div className={compact ? 'group relative' : undefined}>
      <NavLink
        to={to}
        end={end}
        aria-label={compact && !caption ? label : undefined}
        className={({ isActive }) =>
          `mona-sidebar__link ${compact ? 'is-compact' : ''} ${caption ? 'is-labeled' : ''} ${isActive || forceActive ? 'is-active' : ''}`
        }
      >
        {({ isActive }) => (
          <>
            <span className="mona-sidebar__link-inner">
              <Icon
                key={isActive ? `${to}-on` : `${to}-off`}
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
  const childActive = items.some((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`),
  )

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
        onClick={onToggle}
      >
        <span className="mona-sidebar__link-inner">
          <Icon key={childActive || open ? `${label}-on` : `${label}-off`} size={18} strokeWidth={1.8} />
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
            let pos = fanOffset(index, items.length, upward ? (items.length > 6 ? 126 : 104) : 128, upward)
            if (upward) {
              const absX = origin.left + pos.x
              const absY = origin.top + pos.y
              const xMin = 30
              const xMax = window.innerWidth - 30
              const yMin = 72
              if (absX < xMin) pos = { ...pos, x: pos.x + (xMin - absX) }
              if (absX > xMax) pos = { ...pos, x: pos.x - (absX - xMax) }
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

function pathMatches(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function MobileMoreSheet({
  sections,
  openGroups,
  onToggleGroup,
  onClose,
}: {
  sections: ReturnType<typeof mobileMoreSections>
  openGroups: string[]
  onToggleGroup: (id: string) => void
  onClose: () => void
}) {
  const location = useLocation()
  return createPortal(
    <>
      <button type="button" className="mona-more-backdrop" aria-label="Fechar menu" onClick={onClose} />
      <nav className="mona-more-sheet" aria-label="Menu">
        <header className="mona-more-sheet__head">
          <p>Menu</p>
          <button type="button" className="mona-more-sheet__close" aria-label="Fechar" onClick={onClose}>
            <X size={16} />
          </button>
        </header>
        {sections.map((section) => {
          const open = !section.collapsible || openGroups.includes(section.id)
          const GroupIcon = section.icon
          return (
            <div key={section.id} className="mona-sidebar__group">
              {section.collapsible ? (
                <button
                  type="button"
                  className="mona-sidebar__group-toggle"
                  aria-expanded={open}
                  onClick={() => onToggleGroup(section.id)}
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
                  {section.items.map((item) => {
                    const ItemIcon = item.icon
                    const active = pathMatches(location.pathname, item.to)
                    return (
                      <li key={item.key}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/'}
                          className={`mona-more-sheet__link ${active ? 'is-active' : ''}`}
                          onClick={onClose}
                        >
                          <span className="mona-more-sheet__icon">
                            <ItemIcon size={16} strokeWidth={1.8} />
                          </span>
                          {item.label}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )
        })}
      </nav>
    </>,
    document.body,
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
      item?.classList.add('is-notch-item')
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
      const itemRect = bubble.getBoundingClientRect()
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
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(later)
      nav?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      ro?.disconnect()
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
            title="Clique direito para gerenciar · arraste · duplo clique flutua"
          >
            <GripVertical size={12} className="hidden shrink-0 text-ink-300 sm:block" />
            {showTabIcons && <TabIcon size={13} className="shrink-0" strokeWidth={1.9} />}
            <button
              type="button"
              className="max-w-[72px] truncate sm:max-w-[140px]"
              onClick={() => activateTab(tab.id)}
              onContextMenu={(e) => openMenu(e, tab.id, 'docked', index)}
            >
              {tab.title}
            </button>
            <button
              type="button"
              className="hidden shrink-0 rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 md:inline-flex"
              title="Flutuar"
              onClick={() => floatTab(tab.id)}
            >
              <LayoutPanelTop size={12} />
            </button>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
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
            title="Clique direito para gerenciar janela flutuante"
          >
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

function tzCity(id?: string) {
  if (!id) return '—'
  return id.split('/').pop()?.replace(/_/g, ' ') || id
}

function dayKey(value: string | undefined, tz: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-CA', { timeZone: tz })
}

function DockDayPanel() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { preferences, saveTravel, browserTimeZone } = useUserPreferences()
  const [now, setNow] = useState(() => new Date())
  const [doneIds, setDoneIds] = useState<string[]>([])
  const tz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const homeTz = preferences?.homeTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const away =
    Boolean(preferences?.isAwayFromHome) ||
    Boolean(browserTimeZone && homeTz && browserTimeZone !== homeTz && !preferences?.travelModeEnabled)

  const { data: todos = [] } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.get<TodoItem[]>('/todos'),
  })
  const { data: events = [] } = useQuery({
    queryKey: ['agenda-events', tz],
    queryFn: () =>
      api.get<AgendaEvent[]>(`/agenda/events?displayTimeZoneId=${encodeURIComponent(tz)}`),
  })

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  const completeTodo = useMutation({
    mutationFn: (id: string) => api.patch(`/todos/${id}`, { status: 'Done' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['todos'] })
      void qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const today = dayKey(now.toISOString(), tz)
  const openTodos = todos
    .filter((todo) => todo.status !== 'Done' || doneIds.includes(todo.id))
    .filter((todo) => !todo.dueAtLocal || dayKey(todo.dueAtLocal, tz) <= today || doneIds.includes(todo.id))
    .slice(0, 5)
  const todayEvents = events
    .filter((event) => dayKey(event.startAtUtc || event.startAt, tz) === today)
    .slice(0, 5)

  const time = now.toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mona-dock__stack">
      <div className="mona-stack__card">
        <i className="mona-stack__handle" aria-hidden />
        <button type="button" className="mona-day__head" onClick={() => navigate('/todos')}>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            <CheckSquare size={14} strokeWidth={2} />
            Tarefas do dia
          </span>
          <span className="text-[11px] text-ink-500">{openTodos.length} abertas</span>
        </button>
        <ul className="mona-day__list">
          {openTodos.length === 0 && <li className="mona-day__empty">Nada pendente para hoje</li>}
          {openTodos.map((todo) => (
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
        </ul>
      </div>

      <div className="mona-stack__card is-front">
        <i className="mona-stack__handle" aria-hidden />
        <button type="button" className="mona-day__head" onClick={() => navigate('/agenda')}>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
            <CalendarDays size={14} strokeWidth={2} />
            Agenda do dia
          </span>
          <span className="text-[11px] text-ink-500">{todayEvents.length} hoje</span>
        </button>
        <div className="mona-day__clock">
          <strong>{time}</strong>
          <span>{tzCity(tz)}</span>
        </div>
        <ul className="mona-day__list">
          {todayEvents.length === 0 && <li className="mona-day__empty">Sem compromissos hoje</li>}
          {todayEvents.map((event) => (
            <li key={event.id}>
              <button type="button" className="mona-day__row" onClick={() => navigate('/agenda')}>
                <span className="truncate">{event.title}</span>
                <em>
                  {new Date(event.startAtUtc || event.startAt).toLocaleTimeString('pt-BR', {
                    timeZone: tz,
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </em>
              </button>
            </li>
          ))}
        </ul>
        {preferences?.travelModeEnabled ? (
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
        ) : null}
      </div>
    </div>
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
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-brand-50 hover:text-brand-900"
            onClick={() => setOpen(false)}
          >
            <HelpCircle size={16} />
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
  const [moreOpen, setMoreOpen] = useState(false)
  const [sheetGroups, setSheetGroups] = useState<string[]>([])
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isMobile) localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
  }, [collapsed, isMobile])

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setCollapsed(true)
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
  const dockTabs = useMemo(() => mobileTabs(visibleNav), [visibleNav])
  const moreSections = useMemo(() => mobileMoreSections(visibleNav), [visibleNav])
  const moreActive =
    location.pathname === '/mais' ||
    moreSections.some((section) =>
      section.items.some((item) => pathMatches(location.pathname, item.to)),
    )
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
        ?.closest('.group, .mona-fan')
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
    setMoreOpen(false)
  }, [location.pathname, collapsed])

  useEffect(() => {
    if (!fanGroupId && !moreOpen) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        target instanceof Element &&
        target.closest('.mona-fan, .mona-fan__list, .mona-more-sheet, .mona-sidebar__more')
      ) {
        return
      }
      setFanGroupId(null)
      setMoreOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFanGroupId(null)
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [fanGroupId, moreOpen])

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

  const railW = isMobile ? 0 : collapsed ? 80 : 248
  const contentMargin = isMobile ? 0 : 12 + railW + 12
  const compactRail = isMobile || collapsed
  const brandH = isMobile ? 0 : compactRail ? 80 : 72
  const menuTop = 12 + brandH + 10
  const mobileDockH = 72

  return (
    <div className={`mona-shell ${isMobile ? 'is-mobile' : ''}`}>
      {!isMobile && (
      <NavLink
        to="/"
        end
        className={`mona-brand ${compactRail ? 'is-compact' : 'is-wide'}`}
        style={{ width: railW, height: brandH }}
        aria-label="MONA"
        title="MONA"
      >
        <BrandMark compact={compactRail} />
        {import.meta.env.VITE_FAKE_API === '1' && !compactRail && (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700">
              Fake
            </span>
          )}
      </NavLink>
      )}
      <aside
        ref={sidebarRef}
        className={`mona-sidebar fixed z-30 flex overflow-visible ${
          isMobile ? 'is-mobile-dock is-compact' : compactRail ? 'is-compact w-20 flex-col' : 'w-[248px] flex-col'
        }`}
        style={
          isMobile
            ? { top: 'auto', right: 0, bottom: 0, left: 0, height: mobileDockH, width: 'auto' }
            : { top: menuTop, bottom: 12, left: 12 }
        }
      >
        <SidebarIndicator
          enabled
          layout={compactRail ? 'compact' : 'full'}
          orientation={isMobile ? 'horizontal' : 'vertical'}
          tick={`${openGroups.join(',')}|${fanGroupId ?? ''}|${isMobile ? 'm' : 'd'}|${moreOpen ? 'more' : ''}`}
        />
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
        {!isMobile && (
          <div className={`relative z-[3] shrink-0 ${compactRail ? 'px-2 pb-2 pt-3' : 'px-3 pb-2 pt-3'}`}>
              <button
                type="button"
              className={`mona-sidebar__cta ${compactRail ? 'px-0' : ''}`}
              onClick={() => navigate('/todos')}
              title="Nova tarefa"
              >
              <Plus size={16} strokeWidth={2.4} />
              {!compactRail && 'Nova tarefa'}
              </button>
          </div>
        )}

        <nav className="mona-sidebar__nav min-h-0 flex-1">
          {compactRail ? (
            <div className="mona-sidebar__compact">
              {isMobile ? (
                <>
                  {dockTabs.map((tab) => (
                    <div key={tab.id} className="group" onClick={() => setMoreOpen(false)}>
                      <SidebarLink
                        to={tab.to}
                        end={tab.end}
                        icon={tab.icon}
                        label={tab.label}
                        compact
                        caption
                      />
                    </div>
                  ))}
                  {moreSections.length > 0 && (
                    <div className={`group ${moreActive ? 'is-more-active' : ''}`}>
                      <SidebarLink
                        to="/mais"
                        icon={LayoutGrid}
                        label="Mais"
                        compact
                        caption
                        forceActive={moreActive}
                      />
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
      </aside>
      {isMobile && moreOpen && (
        <MobileMoreSheet
          sections={moreSections}
          openGroups={sheetGroups}
          onToggleGroup={(id) =>
            setSheetGroups((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
          }
          onClose={() => setMoreOpen(false)}
        />
      )}

      <div
        className={`mona-canvas min-w-0 flex-1 transition-[margin] ${isMobile ? '' : 'my-3 mr-3'}`}
        style={{
          marginLeft: contentMargin,
          marginRight: isMobile ? 0 : undefined,
          marginTop: isMobile ? 0 : undefined,
        }}
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

        {!isMobile && (
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
          <DockDayPanel />
        </aside>
        )}
      </div>

      <FloatingTabsLayer />
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
