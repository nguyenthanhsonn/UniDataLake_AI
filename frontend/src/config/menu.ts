import type { MenuGroup, MenuItem, RoleCode } from '@/types/auth'

function managerMenu(base: string, label: string): MenuGroup[] {
  return [
    {
      groupTitle: `${label} · Điều hành`,
      items: [
        { title: 'Tổng quan', href: base, iconName: 'LayoutDashboard' },
        { title: 'Phê duyệt nghiệp vụ', href: `${base}/approvals`, iconName: 'ClipboardCheck' },
        { title: 'Phân tích & So sánh', href: `${base}/analytics`, iconName: 'BarChart3' },
        { title: 'Hỏi UniLake AI', href: `${base}/ask`, iconName: 'Sparkles', badge: 'AI' },
        { title: 'Lịch sử truy vấn', href: `${base}/history`, iconName: 'History' },
      ],
    },
  ]
}

function staffMenu(base: string, recordLabel: string): MenuGroup[] {
  return [
    {
      groupTitle: 'Không gian nghiệp vụ',
      items: [
        { title: 'Tổng quan công việc', href: base, iconName: 'LayoutDashboard' },
        { title: recordLabel, href: `${base}/records`, iconName: 'FolderSearch' },
        { title: 'Chi tiết & Xử lý', href: `${base}/detail`, iconName: 'FileCheck2' },
        { title: 'Hỏi UniLake AI', href: `${base}/ask`, iconName: 'Sparkles', badge: 'AI' },
        { title: 'Lịch sử truy vấn', href: `${base}/history`, iconName: 'History' },
      ],
    },
  ]
}

export const ROLE_MENUS: Record<RoleCode, MenuGroup[]> = {
  ADMIN: [
    {
      groupTitle: 'Quản trị hệ thống',
      items: [
        { title: 'Người dùng & Phân quyền', href: '/admin', iconName: 'Users' },
        { title: 'Cấu hình hệ thống & AI', href: '/admin/settings', iconName: 'Settings' },
        { title: 'Nhật ký hệ thống', href: '/admin/system-logs', iconName: 'ScrollText' },
      ],
    },
  ],
  DATA_ADMIN: [
    {
      groupTitle: 'Data Lake Studio',
      items: [
        { title: 'Nguồn dữ liệu', href: '/data', iconName: 'Database' },
        { title: 'Nạp dữ liệu', href: '/data/ingestion', iconName: 'Upload' },
        { title: 'Data Catalog', href: '/data/catalog', iconName: 'BookOpen' },
        { title: 'Data Quality', href: '/data/quality', iconName: 'ShieldCheck' },
        { title: 'Data Lineage', href: '/data/lineage', iconName: 'Workflow' },
        { title: 'Hỏi UniLake AI', href: '/data/ask', iconName: 'Sparkles', badge: 'AI' },
      ],
    },
  ],
  VIEWER: [
    {
      groupTitle: 'Điều hành',
      items: [
        { title: 'Tổng quan điều hành', href: '/viewer', iconName: 'LayoutDashboard' },
        { title: 'Dashboard phân hệ', href: '/viewer/dashboards', iconName: 'BarChart3' },
        { title: 'Hỏi UniLake AI', href: '/viewer/ask', iconName: 'Sparkles', badge: 'AI' },
        { title: 'Lịch sử truy vấn', href: '/viewer/history', iconName: 'History' },
      ],
    },
  ],
  ADMISSIONS_MANAGER: managerMenu('/workspaces/admissions/manager', 'Tuyển sinh'),
  ADMISSIONS_STAFF: staffMenu('/workspaces/admissions/staff', 'Hồ sơ tuyển sinh'),
  ACADEMIC_MANAGER: managerMenu('/workspaces/academic/manager', 'Đào tạo'),
  ACADEMIC_STAFF: staffMenu('/workspaces/academic/staff', 'Hồ sơ học vụ'),
  HR_MANAGER: managerMenu('/workspaces/hr/manager', 'Nhân sự'),
  HR_STAFF: staffMenu('/workspaces/hr/staff', 'Hồ sơ nhân sự'),
}

export const ASK_AI_PATHS: Partial<Record<RoleCode, string>> = Object.fromEntries(
  (Object.entries(ROLE_MENUS) as [RoleCode, MenuGroup[]][])
    .map(([role, groups]) => [
      role,
      groups.flatMap((group) => group.items).find((item) => item.badge === 'AI')?.href,
    ])
    .filter((entry): entry is [RoleCode, string] => Boolean(entry[1]))
)

export function getMenuItemsForRole(role: RoleCode): MenuItem[] {
  return (ROLE_MENUS[role] ?? []).flatMap((group) => group.items)
}
