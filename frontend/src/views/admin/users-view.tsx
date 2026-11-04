'use client'

import { useState } from 'react'

import { Search } from 'lucide-react'

import { Card, KpiCard, MockNotice, PageHeader, Tag } from '@/components/page/page-parts'
import type { Tone } from '@/components/page/page-parts'
import { ROLE_PRIORITY } from '@/config/roles'
import type { RoleCode } from '@/types/auth'

const ROLE_TONE: Record<RoleCode, Tone> = {
  ADMIN: 'amber',
  DATA_ADMIN: 'emerald',
  VIEWER: 'slate',
  ADMISSIONS_MANAGER: 'indigo',
  ADMISSIONS_STAFF: 'sky',
  ACADEMIC_MANAGER: 'indigo',
  ACADEMIC_STAFF: 'sky',
  HR_MANAGER: 'indigo',
  HR_STAFF: 'sky',
}

const USERS: {
  name: string
  email: string
  role: RoleCode
  domains: string
  unit: string
  locked: boolean
  lastLogin: string
}[] = [
  {
    name: 'Nguyễn Toàn',
    email: 'vinh.dq@unilake.edu.vn',
    role: 'VIEWER',
    domains: 'Tuyển sinh · Đào tạo · Nhân sự',
    unit: 'Ban Giám hiệu',
    locked: false,
    lastLogin: '10 phút trước',
  },
  {
    name: 'Trí Đức',
    email: 'hung.nv@unilake.edu.vn',
    role: 'ADMISSIONS_MANAGER',
    domains: 'Tuyển sinh',
    unit: 'Phòng Tuyển sinh',
    locked: false,
    lastLogin: 'Hôm qua',
  },
  {
    name: 'Tô Loan',
    email: 'phuong.ttm@unilake.edu.vn',
    role: 'ADMISSIONS_STAFF',
    domains: 'Tuyển sinh',
    unit: 'Phòng Tuyển sinh',
    locked: false,
    lastLogin: '25 phút trước',
  },
  {
    name: 'Nguyễn Thanh Sơn',
    email: 'minh.lh@unilake.edu.vn',
    role: 'DATA_ADMIN',
    domains: 'Tuyển sinh · Đào tạo · Nhân sự',
    unit: 'Trung tâm Dữ liệu',
    locked: false,
    lastLogin: '1 giờ trước',
  },
  {
    name: 'Trương Đình Đạt',
    email: 'long.nb@unilake.edu.vn',
    role: 'ADMIN',
    domains: 'Tất cả',
    unit: 'Phòng CNTT',
    locked: false,
    lastLogin: 'Vừa xong',
  },
  {
    name: 'Nguyễn Đăng Quang Huy',
    email: 'lien.vtm@unilake.edu.vn',
    role: 'ACADEMIC_MANAGER',
    domains: 'Đào tạo',
    unit: 'Phòng Đào tạo',
    locked: true,
    lastLogin: '1 tuần trước',
  },
]

export function UsersView() {
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<RoleCode | ''>('')

  const q = keyword.trim().toLowerCase()
  const rows = USERS.filter(
    (user) =>
      (!role || user.role === role) &&
      (!q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q))
  )

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={['Quản trị hệ thống', 'Người dùng & Phân quyền']}
        title="Người dùng & Phân quyền (RBAC)"
        description="Quản trị tài khoản, 9 vai trò và phạm vi phân hệ được truy cập theo mô hình RBAC mới."
      />
      <MockNotice api="GET /users" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Tổng số tài khoản"
          value={USERS.length}
          hint={`${USERS.filter((u) => !u.locked).length} đang hoạt động`}
        />
        <KpiCard
          label="Vai trò (RBAC)"
          value="9"
          hint="Hệ thống · Dữ liệu · Điều hành · 6 vai trò nghiệp vụ"
        />
        <KpiCard
          label="Phạm vi theo phân hệ"
          value="BẬT"
          hint="domain_access áp dụng ở backend"
          tone="emerald"
        />
        <KpiCard label="Phiên đang đăng nhập" value="5" hint="JWT · hết hạn sau 60 phút" />
      </div>

      <Card
        title="Tài khoản"
        subtitle={`Hiển thị ${rows.length} / ${USERS.length} tài khoản`}
        right={
          <div className="flex flex-wrap gap-2">
            <label className="relative">
              <span className="sr-only">Tìm tài khoản</span>
              <Search
                className="absolute left-2.5 top-2.5 size-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                className="glass-control h-9 w-56 rounded-2xl pl-8 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                placeholder="Tìm theo tên, email…"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Lọc theo vai trò</span>
              <select
                className="glass-control h-9 rounded-2xl px-2 text-xs"
                value={role}
                onChange={(event) => setRole(event.target.value as RoleCode | '')}
              >
                <option value="">Tất cả vai trò</option>
                {ROLE_PRIORITY.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          </div>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead className="bg-white/35 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                {[
                  'Tài khoản',
                  'Vai trò',
                  'Phân hệ được truy cập',
                  'Đơn vị',
                  'Trạng thái',
                  'Đăng nhập gần nhất',
                ].map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/70">
              {rows.map((user) => (
                <tr key={user.email}>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="font-mono text-[10px] text-slate-400">{user.email}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <Tag tone={ROLE_TONE[user.role]}>{user.role}</Tag>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{user.domains}</td>
                  <td className="px-3 py-2.5 text-slate-600">{user.unit}</td>
                  <td className="px-3 py-2.5">
                    <Tag tone={user.locked ? 'rose' : 'emerald'}>
                      {user.locked ? 'LOCKED' : 'ACTIVE'}
                    </Tag>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
