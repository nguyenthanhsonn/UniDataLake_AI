import type { RoleCode, RoleDefinition } from '@/types/auth'

export const ROLE_CODES: Record<RoleCode, RoleCode> = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DATA_ENGINEER: 'DATA_ENGINEER',
  DATA_GOVERNANCE: 'DATA_GOVERNANCE',
  DATA_ANALYST: 'DATA_ANALYST',
  ACADEMIC_ADMIN: 'ACADEMIC_ADMIN',
  USER: 'USER',
}

export const ROLE_DEFINITIONS: Record<RoleCode, RoleDefinition> = {
  SUPER_ADMIN: {
    code: 'SUPER_ADMIN',
    name: 'Quản trị hệ thống',
    homePath: '/admin',
    description: 'Toàn quyền cấu hình, phân quyền và quản trị hệ thống',
    badgeVariant: 'destructive',
  },
  DATA_ENGINEER: {
    code: 'DATA_ENGINEER',
    name: 'Kỹ sư dữ liệu',
    homePath: '/engineering',
    description: 'Quản lý pipeline ingestion, ETL Medallion và hạ tầng dữ liệu',
    badgeVariant: 'default',
  },
  DATA_GOVERNANCE: {
    code: 'DATA_GOVERNANCE',
    name: 'Quản trị dữ liệu',
    homePath: '/governance',
    description: 'Data catalog, chất lượng dữ liệu DQ, phân loại và bảo mật',
    badgeVariant: 'secondary',
  },
  DATA_ANALYST: {
    code: 'DATA_ANALYST',
    name: 'Chuyên viên phân tích',
    homePath: '/analytics',
    description: 'Truy vấn NLQ AI, báo cáo phân tích và trực quan hóa dữ liệu',
    badgeVariant: 'default',
  },
  ACADEMIC_ADMIN: {
    code: 'ACADEMIC_ADMIN',
    name: 'Quản trị đào tạo',
    homePath: '/academic',
    description: 'Quản lý tuyển sinh, chương trình đào tạo và học viên',
    badgeVariant: 'secondary',
  },
  USER: {
    code: 'USER',
    name: 'Người dùng',
    homePath: '/home',
    description: 'Cổng thông tin dữ liệu và báo cáo tổng hợp đại học',
    badgeVariant: 'outline',
  },
}

/** Priority hierarchy used when determining default home for users with multiple roles */
export const ROLE_PRIORITY: RoleCode[] = [
  'SUPER_ADMIN',
  'DATA_ENGINEER',
  'DATA_GOVERNANCE',
  'DATA_ANALYST',
  'ACADEMIC_ADMIN',
  'USER',
]

export const ROLE_ROUTE_PREFIXES: Record<RoleCode, string> = {
  SUPER_ADMIN: '/admin',
  DATA_ENGINEER: '/engineering',
  DATA_GOVERNANCE: '/governance',
  DATA_ANALYST: '/analytics',
  ACADEMIC_ADMIN: '/academic',
  USER: '/home',
}

export function getDefaultHomeForRoles(roles: RoleCode[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) {
      return ROLE_DEFINITIONS[role].homePath
    }
  }
  return '/home'
}

export function getRoleFromPrefix(pathname: string): RoleCode | null {
  for (const [role, prefix] of Object.entries(ROLE_ROUTE_PREFIXES) as [RoleCode, string][]) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return role
    }
  }
  return null
}

export function hasAccessToRoute(pathname: string, userRoles: RoleCode[]): boolean {
  if (userRoles.includes('SUPER_ADMIN')) {
    return true
  }
  const requiredRole = getRoleFromPrefix(pathname)
  if (!requiredRole) {
    return true
  }
  return userRoles.includes(requiredRole)
}
