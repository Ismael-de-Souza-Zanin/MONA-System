import { AppWindow, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NAV_DEFINITIONS } from '../nav/navConfig'

export function iconForPath(path: string): LucideIcon {
  const clean = path.split('?')[0].replace(/\/+$/, '') || '/'
  const parts = clean.split('/').filter(Boolean)
  if (parts[0] === 'clientes' && parts.length >= 2) return User
  const exact = NAV_DEFINITIONS.find((n) => n.to === clean)
  if (exact) return exact.icon
  const prefix = NAV_DEFINITIONS.find((n) => n.to !== '/' && clean.startsWith(n.to))
  return prefix?.icon ?? AppWindow
}
