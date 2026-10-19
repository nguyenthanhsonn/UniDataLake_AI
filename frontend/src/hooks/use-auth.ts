'use client'

import { useCallback, useMemo } from 'react'

import { useRouter } from 'next/navigation'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Cookies from 'js-cookie'

import { ROLE_PRIORITY } from '@/config/roles'
import type { AuthMeResponse, AuthUser, RoleCode } from '@/types/auth'

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) {
    return null
  }
  const data = (await res.json()) as AuthMeResponse
  return data.user
}

async function logoutApi(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export function useAuth() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    staleTime: 60_000,
    retry: false,
  })

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      Cookies.remove('access_token', { path: '/' })
      Cookies.remove('refresh_token', { path: '/' })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }
      queryClient.setQueryData(['auth', 'me'], null)
      void queryClient.invalidateQueries()
      router.push('/login')
      router.refresh()
    },
  })

  const roles = useMemo(() => user?.roles ?? [], [user?.roles])

  const hasRole = useCallback((role: RoleCode) => roles.includes(role), [roles])

  const hasAnyRole = useCallback(
    (requiredRoles: RoleCode[]) => requiredRoles.some((r) => roles.includes(r)),
    [roles]
  )

  const isSuperAdmin = roles.includes('ADMIN')

  const primaryRole: RoleCode = ROLE_PRIORITY.find((role) => roles.includes(role)) ?? 'VIEWER'

  return {
    user: user ?? null,
    roles,
    primaryRole,
    isAuthenticated: Boolean(user),
    isLoading,
    isError,
    isSuperAdmin,
    hasRole,
    hasAnyRole,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  }
}
