import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MenuPreferenceItem } from '../nav/navConfig'

export interface UserPreferences {
  timeZoneId: string
  homeTimeZoneId?: string
  detectedTimeZoneId?: string
  travelModeEnabled?: boolean
  travelTimeZoneId?: string
  travelLabel?: string
  travelEndsAtUtc?: string
  effectiveTimeZoneId?: string
  isAwayFromHome?: boolean
  menuItems: MenuPreferenceItem[]
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export function useUserPreferences() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['preferences-me'],
    queryFn: () => api.get<UserPreferences>('/preferences/me'),
  })

  const mutation = useMutation({
    mutationFn: (body: Partial<UserPreferences>) => api.put<UserPreferences>('/preferences/me', body),
    onSuccess: (data) => {
      qc.setQueryData(['preferences-me'], data)
    },
  })

  const travelMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.put<UserPreferences>('/preferences/me/travel', body),
    onSuccess: (data) => {
      qc.setQueryData(['preferences-me'], data)
    },
  })

  // Reporta fuso do dispositivo (viagens) sem forçar modo viagem.
  useEffect(() => {
    const detected = browserTimeZone()
    if (!detected || !query.data) return
    if (query.data.detectedTimeZoneId === detected) return
    void travelMutation.mutateAsync({ detectedTimeZoneId: detected })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.timeZoneId, query.data?.detectedTimeZoneId])

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    save: mutation.mutateAsync,
    saveTravel: travelMutation.mutateAsync,
    isSaving: mutation.isPending || travelMutation.isPending,
    browserTimeZone: browserTimeZone(),
  }
}

export function useTimeZones() {
  return useQuery({
    queryKey: ['timezones'],
    queryFn: () => api.get<{ id: string; label: string }[]>('/timezones'),
    staleTime: 60_000 * 60,
  })
}

export function useNotifications() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () =>
      api.get<
        {
          id: string
          title: string
          body: string
          link?: string
          isRead: boolean
          occursAtLocal: string
          timeZoneId: string
          resolutionStatus?: string | null
          priority?: string
        }[]
      >('/notifications'),
    refetchInterval: 60_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = query.data?.filter((n) => !n.isRead).length ?? 0

  return {
    notifications: query.data ?? [],
    unread,
    markRead: markRead.mutate,
    markAll: markAll.mutate,
    isLoading: query.isLoading,
  }
}
