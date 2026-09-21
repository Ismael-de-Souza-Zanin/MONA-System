import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../shared/auth/AuthContext'
import { LoadingSpinner } from '../shared/ui'

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner />
  if (!isAuthenticated) {
    if (location.pathname === '/') {
      return <Navigate to="/conheca" replace />
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
