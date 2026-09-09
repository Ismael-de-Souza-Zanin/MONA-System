import { useAuth } from '../auth/AuthContext'
import type { Permission } from './constants'

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission | Permission[]) => {
    if (!user) return false
    if (user.isOwner) return true
    const required = Array.isArray(permission) ? permission : [permission]
    return required.some((p) => user.permissions.includes(p))
  }

  const hasAllPermissions = (permissions: Permission[]) => {
    if (!user) return false
    if (user.isOwner) return true
    return permissions.every((p) => user.permissions.includes(p))
  }

  return { hasPermission, hasAllPermissions, permissions: user?.permissions ?? [] }
}
