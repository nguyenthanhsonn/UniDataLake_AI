import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getDefaultHomeForRoles, hasAccessToRoute } from '@/config/roles'
import type { RoleCode } from '@/types/auth'

const VALID_ROLES: RoleCode[] = [
  'SUPER_ADMIN',
  'DATA_ENGINEER',
  'DATA_GOVERNANCE',
  'DATA_ANALYST',
  'ACADEMIC_ADMIN',
  'USER',
]

function extractRolesFromToken(token: string): RoleCode[] {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return ['USER']

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr =
      typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf-8')

    const payload = JSON.parse(jsonStr) as Record<string, unknown>
    const rawRoles = (payload.roles as unknown[]) ?? (payload.role ? [payload.role] : [])

    const roles: RoleCode[] = Array.isArray(rawRoles)
      ? rawRoles
          .map((r) => String(r).toUpperCase())
          .filter((r): r is RoleCode => VALID_ROLES.includes(r as RoleCode))
      : []

    return roles.length > 0 ? roles : ['USER']
  } catch {
    return ['USER']
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value

  // Never block or redirect internal Next.js assets or API routes
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // 1. Unauthenticated users
  if (!token) {
    if (pathname === '/login') {
      return NextResponse.next()
    }
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Authenticated users: extract roles
  const userRoles = extractRolesFromToken(token)
  const defaultHome = getDefaultHomeForRoles(userRoles)

  // If visiting /login or root /, redirect to user's role home
  if (pathname === '/login' || pathname === '/') {
    return NextResponse.redirect(new URL(defaultHome, request.url))
  }

  // Check access to role prefix routes
  if (!hasAccessToRoute(pathname, userRoles)) {
    return NextResponse.redirect(new URL(defaultHome, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
