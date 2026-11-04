import type { RoleCode, RoleDefinition } from '@/types/auth'

export const ROLE_CODES: Record<RoleCode, RoleCode> = {
  ADMIN: 'ADMIN',
  DATA_ADMIN: 'DATA_ADMIN',
  VIEWER: 'VIEWER',
  ADMISSIONS_MANAGER: 'ADMISSIONS_MANAGER',
  ADMISSIONS_STAFF: 'ADMISSIONS_STAFF',
  ACADEMIC_MANAGER: 'ACADEMIC_MANAGER',
  ACADEMIC_STAFF: 'ACADEMIC_STAFF',
  HR_MANAGER: 'HR_MANAGER',
  HR_STAFF: 'HR_STAFF',
}

export const ROLE_DEFINITIONS: Record<RoleCode, RoleDefinition> = {
  ADMIN: {
    code: 'ADMIN',
    name: 'Quản trị Hệ thống',
    homePath: '/admin',
    description: 'Cấu hình, phân quyền và giám sát toàn bộ hệ thống',
    workspaceLabel: 'System Studio',
    sampleUser: 'Trương Đình Đạt',
    badgeVariant: 'destructive',
  },
  DATA_ADMIN: {
    code: 'DATA_ADMIN',
    name: 'Quản trị Dữ liệu',
    homePath: '/data',
    description: 'Vận hành nguồn dữ liệu, ingestion, catalog, chất lượng và lineage',
    workspaceLabel: 'Data Lake Studio',
    sampleUser: 'Nguyễn Thanh Sơn',
    badgeVariant: 'default',
  },
  VIEWER: {
    code: 'VIEWER',
    name: 'Ban Giám hiệu',
    homePath: '/viewer',
    description: 'Theo dõi tổng quan điều hành và dashboard liên phân hệ',
    workspaceLabel: 'Executive View',
    sampleUser: 'Nguyễn Toàn',
    badgeVariant: 'outline',
  },
  ADMISSIONS_MANAGER: {
    code: 'ADMISSIONS_MANAGER',
    name: 'Quản lý Tuyển sinh',
    homePath: '/workspaces/admissions/manager',
    description: 'Điều hành chỉ tiêu, chiến dịch và phê duyệt hồ sơ tuyển sinh',
    workspaceLabel: 'Tuyển sinh · Quản lý',
    sampleUser: 'Trí Đức',
    domain: 'admissions',
    badgeVariant: 'secondary',
  },
  ADMISSIONS_STAFF: {
    code: 'ADMISSIONS_STAFF',
    name: 'Chuyên viên Tuyển sinh',
    homePath: '/workspaces/admissions/staff',
    description: 'Tiếp nhận, kiểm tra và cập nhật hồ sơ tuyển sinh',
    workspaceLabel: 'Tuyển sinh · Nghiệp vụ',
    sampleUser: 'Tô Loan',
    domain: 'admissions',
    badgeVariant: 'outline',
  },
  ACADEMIC_MANAGER: {
    code: 'ACADEMIC_MANAGER',
    name: 'Quản lý Đào tạo',
    homePath: '/workspaces/academic/manager',
    description: 'Theo dõi chất lượng đào tạo, tiến độ và phê duyệt học vụ',
    workspaceLabel: 'Đào tạo · Quản lý',
    sampleUser: 'Nguyễn Đăng Quang Huy',
    domain: 'academic',
    badgeVariant: 'secondary',
  },
  ACADEMIC_STAFF: {
    code: 'ACADEMIC_STAFF',
    name: 'Chuyên viên Đào tạo',
    homePath: '/workspaces/academic/staff',
    description: 'Xử lý hồ sơ, dữ liệu môn học và nghiệp vụ đào tạo',
    workspaceLabel: 'Đào tạo · Nghiệp vụ',
    sampleUser: 'Trương Đình Đạt',
    domain: 'academic',
    badgeVariant: 'outline',
  },
  HR_MANAGER: {
    code: 'HR_MANAGER',
    name: 'Quản lý Nhân sự',
    homePath: '/workspaces/hr/manager',
    description: 'Điều hành biên chế, năng lực và phê duyệt nghiệp vụ nhân sự',
    workspaceLabel: 'Nhân sự · Quản lý',
    sampleUser: 'Nguyễn Thanh Sơn',
    domain: 'hr',
    badgeVariant: 'secondary',
  },
  HR_STAFF: {
    code: 'HR_STAFF',
    name: 'Chuyên viên Nhân sự',
    homePath: '/workspaces/hr/staff',
    description: 'Quản lý hồ sơ, hợp đồng và dữ liệu nhân sự',
    workspaceLabel: 'Nhân sự · Nghiệp vụ',
    sampleUser: 'Nguyễn Toàn',
    domain: 'hr',
    badgeVariant: 'outline',
  },
}

export const ROLE_PRIORITY: RoleCode[] = [
  'ADMIN',
  'DATA_ADMIN',
  'ADMISSIONS_MANAGER',
  'ACADEMIC_MANAGER',
  'HR_MANAGER',
  'ADMISSIONS_STAFF',
  'ACADEMIC_STAFF',
  'HR_STAFF',
  'VIEWER',
]

export const ROLE_ROUTE_PREFIXES: Record<RoleCode, string> = Object.fromEntries(
  Object.entries(ROLE_DEFINITIONS).map(([role, definition]) => [role, definition.homePath])
) as Record<RoleCode, string>

const LEGACY_ROLE_ALIASES: Record<string, RoleCode> = {
  SUPER_ADMIN: 'ADMIN',
  ANALYST: 'VIEWER',
  MANAGER: 'VIEWER',
}

export function normalizeRoleCode(value: unknown): RoleCode | null {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (code in ROLE_DEFINITIONS) return code as RoleCode
  return LEGACY_ROLE_ALIASES[code] ?? null
}

export function getDefaultHomeForRoles(roles: RoleCode[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return ROLE_DEFINITIONS[role].homePath
  }
  return ROLE_DEFINITIONS.VIEWER.homePath
}

export function getRoleFromPrefix(pathname: string): RoleCode | null {
  if (pathname === '/analyst' || pathname.startsWith('/analyst/')) return 'VIEWER'
  if (pathname === '/manager' || pathname.startsWith('/manager/')) return 'VIEWER'
  if (pathname.startsWith('/engineering') || pathname.startsWith('/governance')) return 'DATA_ADMIN'

  const match = (Object.entries(ROLE_ROUTE_PREFIXES) as [RoleCode, string][]).find(
    ([, prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  return match?.[0] ?? null
}

export function hasAccessToRoute(pathname: string, userRoles: RoleCode[]): boolean {
  if (userRoles.includes('ADMIN')) return true
  const requiredRole = getRoleFromPrefix(pathname)
  return requiredRole ? userRoles.includes(requiredRole) : true
}
