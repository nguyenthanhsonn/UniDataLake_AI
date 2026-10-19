import type { RoleCode, RoleDefinition } from '@/types/auth'

export const ROLE_CODES: Record<RoleCode, RoleCode> = {
  ADMIN: 'ADMIN',
  DATA_ADMIN: 'DATA_ADMIN',
  ANALYST: 'ANALYST',
  MANAGER: 'MANAGER',
  VIEWER: 'VIEWER',
}

export const ROLE_DEFINITIONS: Record<RoleCode, RoleDefinition> = {
  ADMIN: {
    code: 'ADMIN',
    name: 'Quản trị hệ thống',
    homePath: '/admin',
    description: 'Toàn quyền cấu hình, phân quyền và quản trị hệ thống',
    badgeVariant: 'destructive',
  },
  DATA_ADMIN: {
    code: 'DATA_ADMIN',
    name: 'Quản trị & Kỹ thuật dữ liệu',
    homePath: '/data',
    description: 'Quản lý pipeline ingestion, Medallion, catalog và chất lượng dữ liệu',
    badgeVariant: 'default',
  },
  ANALYST: {
    code: 'ANALYST',
    name: 'Chuyên viên phân tích',
    homePath: '/analyst',
    description: 'Truy vấn NLQ AI, báo cáo phân tích và trực quan hóa dữ liệu',
    badgeVariant: 'default',
  },
  MANAGER: {
    code: 'MANAGER',
    name: 'Quản trị đào tạo',
    homePath: '/manager',
    description: 'Quản lý tuyển sinh, chương trình đào tạo và học viên',
    badgeVariant: 'secondary',
  },
  VIEWER: {
    code: 'VIEWER',
    name: 'Người xem',
    homePath: '/viewer',
    description: 'Cổng thông tin dữ liệu và báo cáo tổng hợp đại học',
    badgeVariant: 'outline',
  },
}

/** Thứ tự ưu tiên để xác định trang chủ mặc định cho người dùng có nhiều vai trò */
export const ROLE_PRIORITY: RoleCode[] = ['ADMIN', 'DATA_ADMIN', 'ANALYST', 'MANAGER', 'VIEWER']

export const ROLE_ROUTE_PREFIXES: Record<RoleCode, string> = {
  ADMIN: '/admin',
  DATA_ADMIN: '/data',
  ANALYST: '/analyst',
  MANAGER: '/manager',
  VIEWER: '/viewer',
}

export function getDefaultHomeForRoles(roles: RoleCode[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return ROLE_DEFINITIONS[role].homePath
    }
  }
  return '/viewer'
}

export function getRoleFromPrefix(pathname: string): RoleCode | null {
  if (
    pathname === '/data' ||
    pathname.startsWith('/data/') ||
    pathname.startsWith('/engineering') ||
    pathname.startsWith('/governance')
  ) {
    return 'DATA_ADMIN'
  }
  if (
    pathname === '/analyst' ||
    pathname.startsWith('/analyst/') ||
    pathname.startsWith('/analytics')
  ) {
    return 'ANALYST'
  }
  if (
    pathname === '/manager' ||
    pathname.startsWith('/manager/') ||
    pathname.startsWith('/academic')
  ) {
    return 'MANAGER'
  }
  if (pathname === '/viewer' || pathname.startsWith('/viewer/') || pathname.startsWith('/home')) {
    return 'VIEWER'
  }
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'ADMIN'
  }
  return null
}

export function hasAccessToRoute(pathname: string, userRoles: RoleCode[]): boolean {
  if (userRoles.includes('ADMIN')) {
    return true
  }
  const requiredRole = getRoleFromPrefix(pathname)
  if (!requiredRole) {
    return true
  }
  return userRoles.includes(requiredRole)
}
