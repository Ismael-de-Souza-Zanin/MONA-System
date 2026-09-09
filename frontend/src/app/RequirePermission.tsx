import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '../shared/permissions/hooks'
import type { Permission } from '../shared/permissions/constants'
import { EmptyState } from '../shared/ui'

interface RequirePermissionProps {
  permission: Permission | Permission[]
}

export function RequirePermission({ permission }: RequirePermissionProps) {
  const { hasPermission } = usePermissions()

  if (!hasPermission(permission)) {
    return (
      <div className="p-8">
        <EmptyState
          title="Acesso negado"
          description="Você não tem permissão para acessar esta página."
        />
      </div>
    )
  }

  return <Outlet />
}

export function RequirePermissionRedirect({ permission }: RequirePermissionProps) {
  const { hasPermission } = usePermissions()
  if (!hasPermission(permission)) return <Navigate to="/" replace />
  return <Outlet />
}
