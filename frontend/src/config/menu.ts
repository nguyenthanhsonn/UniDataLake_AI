import type { MenuGroup, MenuItem, RoleCode } from '@/types/auth'

export const ROLE_MENUS: Record<RoleCode, MenuGroup[]> = {
  SUPER_ADMIN: [
    {
      groupTitle: 'Quản trị hệ thống',
      items: [
        {
          title: 'Tổng quan hệ thống',
          href: '/admin',
          iconName: 'LayoutDashboard',
          description: 'Giám sát tài nguyên, phân quyền và trạng thái',
        },
        {
          title: 'Người dùng',
          href: '/admin/users',
          iconName: 'Users',
          description: 'Quản lý tài khoản và phân quyền người dùng',
        },
        {
          title: 'Vai trò & Quyền hạn',
          href: '/admin/roles',
          iconName: 'Shield',
          description: 'Cấu hình 6 nhóm quyền RBAC',
        },
        {
          title: 'Cấu hình hệ thống',
          href: '/admin/settings',
          iconName: 'Settings',
          description: 'Tham số API, bảo mật và kết nối dịch vụ',
        },
        {
          title: 'Nhật ký kiểm toán',
          href: '/admin/audit-logs',
          iconName: 'FileText',
          description: 'Audit log và lịch sử thao tác người dùng',
        },
      ],
    },
  ],

  DATA_ENGINEER: [
    {
      groupTitle: 'Kỹ thuật dữ liệu',
      items: [
        {
          title: 'Ingestion Pipelines',
          href: '/engineering',
          iconName: 'GitBranch',
          description: 'Quản lý các luồng nạp dữ liệu tự động',
        },
        {
          title: 'Nguồn dữ liệu',
          href: '/engineering/sources',
          iconName: 'Database',
          description: 'PostgreSQL, CSV, REST API connectors',
        },
        {
          title: 'Medallion Storage',
          href: '/engineering/storage',
          iconName: 'Layers',
          badge: 'Bronze / Silver / Gold',
          description: 'Lưu trữ Delta Lake & MinIO theo tầng',
        },
        {
          title: 'DuckDB & Hạ tầng',
          href: '/engineering/infra',
          iconName: 'HardDrive',
          description: 'Engine tính toán phân tích cục bộ',
        },
      ],
    },
  ],

  DATA_GOVERNANCE: [
    {
      groupTitle: 'Quản trị dữ liệu',
      items: [
        {
          title: 'Data Catalog',
          href: '/governance',
          iconName: 'BookOpen',
          description: 'Từ điển dữ liệu và metadata quản trị đại học',
        },
        {
          title: 'Phân loại & PII',
          href: '/governance/classification',
          iconName: 'ShieldCheck',
          description: 'Bảo vệ thông tin cá nhân sinh viên và cán bộ',
        },
        {
          title: 'Chất lượng dữ liệu (DQ)',
          href: '/governance/quality',
          iconName: 'CheckCircle2',
          description: 'Bộ quy tắc kiểm tra tính toàn vẹn dữ liệu',
        },
        {
          title: 'Chính sách truy cập',
          href: '/governance/policies',
          iconName: 'KeyRound',
          description: 'Phân quyền mức bảng và cột dữ liệu',
        },
      ],
    },
  ],

  DATA_ANALYST: [
    {
      groupTitle: 'Phân tích & Khai phá',
      items: [
        {
          title: 'Trợ lý NLQ AI',
          href: '/analytics',
          iconName: 'Bot',
          badge: 'AI',
          description: 'Hỏi dữ liệu quản trị bằng ngôn ngữ tự nhiên',
        },
        {
          title: 'Dashboards & KPIs',
          href: '/analytics/dashboards',
          iconName: 'BarChart3',
          description: 'Biểu đồ tuyển sinh, học tập và tài chính',
        },
        {
          title: 'Khám phá dữ liệu',
          href: '/analytics/explore',
          iconName: 'Table',
          description: 'Truy vấn trực tiếp qua SQL Read-only',
        },
        {
          title: 'Lịch sử truy vấn',
          href: '/analytics/history',
          iconName: 'History',
          description: 'Xem lại các câu hỏi NLQ và kết quả',
        },
      ],
    },
  ],

  ACADEMIC_ADMIN: [
    {
      groupTitle: 'Quản trị đào tạo',
      items: [
        {
          title: 'Tổng quan học vụ',
          href: '/academic',
          iconName: 'GraduationCap',
          description: 'Thống kê tình hình đào tạo toàn trường',
        },
        {
          title: 'Tuyển sinh',
          href: '/academic/admissions',
          iconName: 'UserPlus',
          description: 'Đợt tuyển sinh, phương thức và điểm chuẩn',
        },
        {
          title: 'Chương trình đào tạo',
          href: '/academic/programs',
          iconName: 'Layers',
          description: 'Ngành học, khung chương trình và học phần',
        },
        {
          title: 'Hồ sơ sinh viên',
          href: '/academic/students',
          iconName: 'Users',
          description: 'Danh sách và trạng thái sinh viên chính quy',
        },
      ],
    },
  ],

  USER: [
    {
      groupTitle: 'Cổng thông tin',
      items: [
        {
          title: 'Bảng tin dữ liệu',
          href: '/home',
          iconName: 'Home',
          description: 'Trang chủ và thông báo dữ liệu mới',
        },
        {
          title: 'Báo cáo của tôi',
          href: '/home/reports',
          iconName: 'FileBarChart',
          description: 'Các báo cáo được chia sẻ và lưu trữ',
        },
        {
          title: 'Tra cứu thông tin',
          href: '/home/search',
          iconName: 'Search',
          description: 'Tìm kiếm chỉ mục và số liệu tổng hợp',
        },
      ],
    },
  ],
}

export function getMenuItemsForRole(role: RoleCode): MenuItem[] {
  const groups = ROLE_MENUS[role] ?? []
  return groups.flatMap((group) => group.items)
}
