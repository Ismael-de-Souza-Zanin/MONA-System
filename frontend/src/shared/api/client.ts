const API_BASE_STORAGE_KEY = 'fatto_api_base'

/** Resolve API root: override local → VITE_API_BASE → /api/v1 (web/proxy). */
export function getApiBase(): string {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(API_BASE_STORAGE_KEY)?.trim()
    if (stored) return stored.replace(/\/$/, '')
  }
  const fromEnv = (import.meta.env.VITE_API_BASE as string | undefined)?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return '/api/v1'
}

/** Permite apontar o desktop (.exe) para outra API sem rebuild. */
export function setApiBaseOverride(url: string | null) {
  if (typeof localStorage === 'undefined') return
  if (!url?.trim()) {
    localStorage.removeItem(API_BASE_STORAGE_KEY)
    return
  }
  localStorage.setItem(API_BASE_STORAGE_KEY, url.trim().replace(/\/$/, ''))
}

/** @deprecated use getApiBase() — mantido para imports existentes */
export const API_BASE = '/api/v1'

type RequestOptions = RequestInit & {
  skipAuth?: boolean
  raw?: boolean
}

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('fatto_refresh_token')
  if (!refreshToken) return false

  try {
    const res = await fetch(`${getApiBase()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return false
    const data = await res.json()
    localStorage.setItem('fatto_access_token', data.accessToken)
    localStorage.setItem('fatto_refresh_token', data.refreshToken)
    return true
  } catch {
    return false
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    return data.detail || data.message || data.title || `Erro ${res.status}`
  } catch {
    return `Erro ${res.status}`
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, raw, ...init } = options
  const headers = new Headers(init.headers)
  const base = getApiBase()

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = localStorage.getItem('fatto_access_token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  let res = await fetch(`${base}${path}`, { ...init, headers })

  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null
      })
    }
    const refreshed = await refreshPromise
    if (refreshed) {
      const token = localStorage.getItem('fatto_access_token')
      if (token) headers.set('Authorization', `Bearer ${token}`)
      res = await fetch(`${base}${path}`, { ...init, headers })
    }
  }

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  if (raw) return undefined as T
  if (res.status === 204) return undefined as T

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE', raw: true }),

  postForm: <T>(path: string, form: FormData, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: 'POST',
      body: form,
    }),
}

export { API_BASE_STORAGE_KEY }
