import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import type { AuthUser, LoginResponse } from '../types'
import { clearTokens, getAccessToken, hasTokens, setTokens } from './tokens'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!hasTokens()) {
      setUser(null)
      return
    }
    try {
      const me = await api.get<AuthUser>('/auth/me')
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      if (getAccessToken()) {
        await refreshUser()
      }
      setIsLoading(false)
    }
    void init()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { skipAuth: true },
    )
    setTokens(res.accessToken, res.refreshToken)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    } finally {
      clearTokens()
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
