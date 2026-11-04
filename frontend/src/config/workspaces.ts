import type { RoleCode } from '@/types/auth'

export type WorkspaceDomain = 'admissions' | 'academic' | 'hr'
export type WorkspaceScope = 'manager' | 'staff'
export type WorkspaceView = 'approvals' | 'analytics' | 'records' | 'detail'

export interface WorkspaceConfig {
  domain: WorkspaceDomain
  scope: WorkspaceScope
  role: RoleCode
  label: string
  shortLabel: string
  accent: 'indigo' | 'emerald' | 'rose'
  recordLabel: string
  metricLabels: [string, string, string, string]
}

const DOMAIN_CONFIG: Record<WorkspaceDomain, Omit<WorkspaceConfig, 'scope' | 'role'>> = {
  admissions: {
    domain: 'admissions',
    label: 'Tuyển sinh',
    shortLabel: 'TS',
    accent: 'indigo',
    recordLabel: 'hồ sơ tuyển sinh',
    metricLabels: ['Hồ sơ mới', 'Đã xác minh', 'Chờ bổ sung', 'Tỷ lệ nhập học'],
  },
  academic: {
    domain: 'academic',
    label: 'Đào tạo',
    shortLabel: 'ĐT',
    accent: 'emerald',
    recordLabel: 'hồ sơ học vụ',
    metricLabels: ['Lớp đang mở', 'Sinh viên', 'Cảnh báo học vụ', 'Tỷ lệ đạt'],
  },
  hr: {
    domain: 'hr',
    label: 'Nhân sự',
    shortLabel: 'NS',
    accent: 'rose',
    recordLabel: 'hồ sơ nhân sự',
    metricLabels: ['Nhân sự hiện tại', 'Hợp đồng sắp hạn', 'Yêu cầu mới', 'Tỷ lệ hoàn tất'],
  },
}

const ROLE_BY_WORKSPACE: Record<`${WorkspaceDomain}:${WorkspaceScope}`, RoleCode> = {
  'admissions:manager': 'ADMISSIONS_MANAGER',
  'admissions:staff': 'ADMISSIONS_STAFF',
  'academic:manager': 'ACADEMIC_MANAGER',
  'academic:staff': 'ACADEMIC_STAFF',
  'hr:manager': 'HR_MANAGER',
  'hr:staff': 'HR_STAFF',
}

export function isWorkspaceDomain(value: string): value is WorkspaceDomain {
  return value in DOMAIN_CONFIG
}

export function isWorkspaceScope(value: string): value is WorkspaceScope {
  return value === 'manager' || value === 'staff'
}

export function getWorkspaceConfig(domain: string, scope: string): WorkspaceConfig | null {
  if (!isWorkspaceDomain(domain) || !isWorkspaceScope(scope)) return null
  return { ...DOMAIN_CONFIG[domain], scope, role: ROLE_BY_WORKSPACE[`${domain}:${scope}`] }
}
