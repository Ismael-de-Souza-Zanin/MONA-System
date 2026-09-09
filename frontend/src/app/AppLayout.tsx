import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
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
  Pencil,
  Check,
  MessageSquare,
  LayoutPanelTop,
  Moon,
  Sun,
} from 'lucide-react'
import { useAuth } from '../shared/auth/AuthContext'
import { useTheme } from '../shared/theme/ThemeContext'
import { usePermissions } from '../shared/permissions/hooks'
import { NAV_DEFINITIONS, resolveMenu, type MenuPreferenceItem } from '../shared/nav/navConfig'
import { useNotifications, useUserPreferences, useTimeZones } from '../shared/hooks/useWorkspaceData'
import { WorkspaceTabsProvider, useWorkspaceTabs } from './WorkspaceTabsContext'
import { FloatingTabsLayer } from './FloatingTabsLayer'
import { ChatWidget } from '../features/chat/ChatWidget'
import { BrandLogo, Button, Checkbox, Select } from '../shared/ui'

const WHATSAPP_URL = 'https://wa.me/5511999999999'
const SIDEBAR_KEY = 'fatto_sidebar_collapsed'

function BrandMark({ compact }: { compact?: boolean }) {
  // PNG já traz o wordmark; no sidebar expandido só aumentamos o ícone
  return <BrandLogo size={compact ? 36 : 44} />
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

function WorkspaceTabBar() {
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
  const navigate = useNavigate()
  const docked = tabs.filter((t) => t.mode === 'docked')
  const floating = tabs.filter((t) => t.mode === 'floating')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [menu, setMenu] = useState<TabMenuState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-tab-id="${activeId}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeId, tabs.length])

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

  if (docked.length <= 1 && floating.length === 0) return null

  const menuTab = menu ? tabs.find((t) => t.id === menu.tabId) : null
  const canCloseRight = menu?.mode === 'docked' && menu.dockIndex < menu.dockCount - 1
  const canCloseOthers = tabs.length > 1

  return (
    <div className="flex min-w-0 flex-col gap-1 border-b border-ink-100 bg-ink-50/80 px-2 py-1.5 sm:flex-row sm:items-stretch sm:gap-2">
      <div
        ref={scrollerRef}
        className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain scroll-smooth [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      >
        {docked.map((tab, index) => (
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
            className={`flex shrink-0 items-center gap-0.5 rounded-lg px-1.5 py-1.5 text-xs font-medium sm:gap-1 sm:px-2 ${
              activeId === tab.id
                ? 'bg-white text-brand-900 shadow-sm ring-1 ring-brand-800/20'
                : 'text-ink-600 hover:bg-white/70'
            }`}
            title="Clique direito para gerenciar · arraste · duplo clique flutua"
          >
            <GripVertical size={12} className="hidden shrink-0 text-ink-300 sm:block" />
            <button
              type="button"
              className="max-w-[100px] truncate sm:max-w-[140px]"
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
        ))}
        {floating.map((tab) => (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            onContextMenu={(e) => openMenu(e, tab.id, 'floating', -1)}
            className={`flex shrink-0 items-center gap-0.5 rounded-lg border border-dashed border-brand-800/30 bg-brand-50/80 px-1.5 py-1.5 text-xs font-medium sm:gap-1 sm:px-2 ${
              activeId === tab.id ? 'ring-1 ring-brand-800/30' : ''
            }`}
            title="Clique direito para gerenciar janela flutuante"
          >
            <LayoutPanelTop size={12} className="shrink-0 text-brand-800" />
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
        ))}
      </div>

      {floating.length > 0 && (
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

      {menu &&
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

function AppShell() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const embed = searchParams.get('embed') === '1'
  const { preferences, save, saveTravel, browserTimeZone } = useUserPreferences()
  const { data: timezones = [] } = useTimeZones()
  const { notifications, unread, markRead, markAll } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState(false)
  const [draftMenu, setDraftMenu] = useState<MenuPreferenceItem[]>([])
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return true
    return localStorage.getItem(SIDEBAR_KEY) === '1'
  })
  const effectiveTz = preferences?.effectiveTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const homeTz = preferences?.homeTimeZoneId || preferences?.timeZoneId || 'America/Sao_Paulo'
  const detectedDiffers =
    !!browserTimeZone &&
    !!homeTz &&
    browserTimeZone !== homeTz &&
    !preferences?.travelModeEnabled

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

  const startEditMenu = () => {
    const current = preferences?.menuItems?.length
      ? preferences.menuItems
      : allowedNav.map((i) => ({ key: i.key, visible: true, customLabel: i.label }))
    const missing = allowedNav
      .filter((a) => !current.some((c) => c.key === a.key))
      .map((a) => ({ key: a.key, visible: true, customLabel: a.label }))
    setDraftMenu([...current, ...missing])
    setEditingMenu(true)
    setCollapsed(false)
  }

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...draftMenu]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setDraftMenu(next)
  }

  const saveMenu = async () => {
    await save({
      timeZoneId: preferences?.timeZoneId || 'America/Sao_Paulo',
      menuItems: draftMenu,
    })
    setEditingMenu(false)
  }

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
      .join('') || 'FV'

  if (embed) {
    return (
      <div className="min-h-screen bg-ink-50 p-4">
        <Outlet />
      </div>
    )
  }

  // No mobile o menu expandido é drawer; a coluna de conteúdo mantém só o trilho (64px).
  const contentMargin = isMobile ? 64 : collapsed ? 64 : 248
  const drawerOpen = isMobile && !collapsed

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-ink-50">
      {drawerOpen && (
        <button
          type="button"
          className="fixed inset-0 z-20 bg-ink-950/30 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setCollapsed(true)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-ink-100 bg-white transition-[width] ${
          collapsed && !drawerOpen ? 'w-16' : 'w-[248px]'
        }`}
      >
        <div className={`flex shrink-0 items-center gap-2 px-3 py-4 ${collapsed && !drawerOpen ? 'flex-col' : 'px-4'}`}>
          <BrandMark compact={collapsed && !drawerOpen} />
          {collapsed && !drawerOpen ? (
            <button
              type="button"
              className="rounded-xl border border-ink-100 p-2 text-ink-700 hover:bg-ink-50"
              title="Expandir menu"
              aria-label="Expandir menu"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="ml-auto rounded-lg p-1.5 text-ink-500 hover:bg-ink-50"
              title="Recolher menu"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {!(collapsed && !drawerOpen) && (
          <div className="min-w-0 shrink-0 space-y-2 overflow-hidden px-3 pb-2">
            {!editingMenu ? (
              <button
                type="button"
                onClick={startEditMenu}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-100 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50"
              >
                <Pencil size={14} />
                Personalizar menu
              </button>
            ) : (
              <div className="min-w-0 overflow-hidden rounded-xl border border-brand-200 bg-brand-50/50 p-2">
                <p className="mb-2 text-[11px] font-semibold text-brand-900">Editando menu neste painel</p>
                <div className="mb-2 grid min-w-0 gap-2">
                  <Select
                    label="Fuso casa"
                    className="w-full max-w-full truncate text-xs"
                    value={preferences?.timeZoneId || 'America/Sao_Paulo'}
                    onChange={(e) =>
                      void save({ timeZoneId: e.target.value, menuItems: preferences?.menuItems || [] })
                    }
                  >
                    {(timezones.length
                      ? timezones
                      : [{ id: 'America/Sao_Paulo', label: 'America/Sao_Paulo' }]
                    ).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Fuso viagem"
                    className="w-full max-w-full truncate text-xs"
                    value={preferences?.travelTimeZoneId || ''}
                    onChange={(e) =>
                      void saveTravel({
                        travelTimeZoneId: e.target.value || null,
                        travelModeEnabled: !!e.target.value,
                        travelLabel: e.target.value || null,
                      })
                    }
                  >
                    <option value="">— Desligado —</option>
                    {timezones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <p className="mb-2 break-all text-[10px] text-ink-500">Efetivo: {effectiveTz}</p>
                <div className="flex min-w-0 gap-1">
                  <Button size="sm" className="min-w-0 flex-1" onClick={() => void saveMenu()}>
                    <Check size={14} /> Salvar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingMenu(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
          <ul className="space-y-1">
            {(editingMenu ? draftMenu : visibleNav.map((v) => ({ key: v.key, visible: true, customLabel: v.label }))).map(
              (item, index) => {
                const def = allowedNav.find((a) => a.key === item.key)
                if (!def) return null
                const Icon = def.icon
                const label = item.customLabel || def.label
                if (editingMenu) {
                  return (
                    <li
                      key={item.key}
                      className="flex min-w-0 items-center gap-1 rounded-xl border border-dashed border-ink-200 bg-white px-1.5 py-1.5"
                    >
                      <GripVertical size={12} className="shrink-0 text-ink-300" />
                      <Checkbox
                        checked={item.visible !== false}
                        onChange={(e) => {
                          const next = [...draftMenu]
                          next[index] = { ...item, visible: e.target.checked }
                          setDraftMenu(next)
                        }}
                      />
                      <input
                        className="min-w-0 flex-1 rounded border border-ink-100 px-1.5 py-0.5 text-xs"
                        value={label}
                        onChange={(e) => {
                          const next = [...draftMenu]
                          next[index] = { ...item, customLabel: e.target.value }
                          setDraftMenu(next)
                        }}
                      />
                      <button type="button" className="shrink-0 text-[10px] text-ink-500" onClick={() => moveItem(index, -1)}>
                        ↑
                      </button>
                      <button type="button" className="shrink-0 text-[10px] text-ink-500" onClick={() => moveItem(index, 1)}>
                        ↓
                      </button>
                    </li>
                  )
                }
                if (collapsed && !drawerOpen) {
                  return (
                    <li key={item.key} className="group relative">
                      <NavLink
                        to={def.to}
                        end={def.to === '/'}
                        aria-label={label}
                        className={({ isActive }) =>
                          `flex items-center justify-center rounded-xl p-2.5 ${
                            isActive ? 'bg-brand-800 text-white' : 'text-ink-700 hover:bg-ink-50'
                          }`
                        }
                      >
                        <Icon size={18} strokeWidth={1.8} />
                      </NavLink>
                      <span
                        className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100"
                        role="tooltip"
                      >
                        {label}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={item.key}>
                    <NavLink
                      to={def.to}
                      end={def.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-brand-800 text-white shadow-sm'
                            : 'text-ink-700 hover:bg-ink-50'
                        }`
                      }
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      {item.customLabel || def.label}
                    </NavLink>
                  </li>
                )
              },
            )}
          </ul>
        </nav>

        <div
          className={`shrink-0 space-y-1 border-t border-ink-100 ${
            collapsed && !drawerOpen ? 'p-2' : 'space-y-2 p-3'
          }`}
        >
          {!(collapsed && !drawerOpen) && (
            <div className="rounded-2xl bg-brand-50 px-3 py-3">
              <p className="text-xs font-semibold text-brand-900">Fuso efetivo</p>
              <p className="truncate text-sm font-semibold text-ink-900">{effectiveTz}</p>
            </div>
          )}
          {(
            [
              { to: '/notificacoes', label: 'Central de alertas', icon: Bell },
              { to: '/chat', label: 'Chat interno', icon: MessageSquare },
              { to: '/configuracoes', label: 'Configurações', icon: Settings },
            ] as const
          ).map((item) => {
            const Icon = item.icon
            if (collapsed && !drawerOpen) {
              return (
                <div key={item.to} className="group relative">
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      `flex items-center justify-center rounded-xl p-2.5 ${
                        isActive ? 'bg-brand-50 text-brand-900' : 'text-ink-700 hover:bg-ink-50'
                      }`
                    }
                  >
                    <Icon size={16} />
                  </NavLink>
                  <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100">
                    {item.label}
                  </span>
                </div>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    isActive ? 'bg-brand-50 text-brand-900' : 'text-ink-700 hover:bg-ink-50'
                  }`
                }
              >
                <Icon size={16} /> {item.label}
              </NavLink>
            )
          })}
          {collapsed && !drawerOpen ? (
            <div className="group relative">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Central de ajuda"
                className="flex items-center justify-center rounded-xl p-2.5 text-ink-700 hover:bg-ink-50"
              >
                <HelpCircle size={16} />
              </a>
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100">
                Central de ajuda
              </span>
            </div>
          ) : (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
            >
              <HelpCircle size={16} /> Central de ajuda
            </a>
          )}
          {collapsed && !drawerOpen ? (
            <div className="group relative">
              <button
                type="button"
                onClick={() => void handleLogout()}
                aria-label="Sair"
                className="flex w-full items-center justify-center rounded-xl p-2.5 text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
              </button>
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition duration-150 group-hover:opacity-100">
                Sair
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          )}
        </div>
      </aside>

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col overflow-x-hidden transition-[margin]"
        style={{ marginLeft: contentMargin }}
      >
        <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
            {/* Só no mobile: no desktop o expandir fica no trilho do menu (evita ícone duplicado). */}
            {collapsed && (
              <button
                type="button"
                className="shrink-0 rounded-xl border border-ink-100 p-2 text-ink-700 hover:bg-ink-50 md:hidden"
                onClick={() => setCollapsed(false)}
                aria-label="Abrir menu"
              >
                <PanelLeftOpen size={16} />
              </button>
            )}
            <div className="relative mx-auto min-w-0 w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
              <input
                type="search"
                placeholder="Buscar..."
                className="w-full rounded-full border border-ink-100 bg-ink-50 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-800 focus:bg-white focus:ring-4 focus:ring-brand-800/10 sm:py-2.5 sm:pr-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value.trim()
                    if (q) navigate(`/clientes?q=${encodeURIComponent(q)}`)
                  }
                }}
              />
            </div>
            <div className="relative ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="rounded-full border border-ink-100 p-2 text-ink-700 hover:bg-ink-50"
                aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                onClick={() => toggleTheme()}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                type="button"
                className="relative rounded-full border border-ink-100 p-2 text-ink-700 hover:bg-ink-50"
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
                <div className="absolute right-0 top-12 z-40 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-ink-100 bg-white p-3 shadow-xl">
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
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm ${n.isRead ? 'bg-ink-50/50' : 'bg-brand-50'}`}
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
              <div className="flex items-center gap-2 rounded-full border border-ink-100 p-1 sm:gap-3 sm:py-1.5 sm:pl-1.5 sm:pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-900 sm:h-9 sm:w-9">
                  {initials}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
                  <p className="text-xs text-ink-500">
                    {user?.isOwner ? 'Conta principal' : 'Usuário compartilhado'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <WorkspaceTabBar />
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          {(preferences?.isAwayFromHome || detectedDiffers) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
              <div>
                {preferences?.travelModeEnabled ? (
                  <p>
                    Modo viagem: <strong>{effectiveTz}</strong>
                    {preferences.travelLabel ? ` (${preferences.travelLabel})` : ''}. Casa: {homeTz}.
                  </p>
                ) : (
                  <p>
                    Dispositivo em <strong>{browserTimeZone}</strong>; fuso casa é <strong>{homeTz}</strong>.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!preferences?.travelModeEnabled && browserTimeZone && (
                  <Button
                    size="sm"
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
                  </Button>
                )}
                {preferences?.travelModeEnabled && (
                  <Button size="sm" variant="secondary" onClick={() => void saveTravel({ travelModeEnabled: false })}>
                    Voltar ao fuso casa
                  </Button>
                )}
              </div>
            </div>
          )}
          <Outlet />
        </main>
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
