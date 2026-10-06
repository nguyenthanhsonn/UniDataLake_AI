import { Activity, ShieldCheck, UserCheck, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const sampleUsers = [
  {
    username: 'admin_sys',
    fullName: 'Nguyễn Văn Quản',
    email: 'admin@unilake.edu.vn',
    roles: ['SUPER_ADMIN'],
    status: 'Đang hoạt động',
    lastLogin: 'Hôm nay, 08:42',
  },
  {
    username: 'de_toan',
    fullName: 'Lê Hoàng Toàn',
    email: 'toan.lh@unilake.edu.vn',
    roles: ['DATA_ENGINEER', 'DATA_ANALYST'],
    status: 'Đang hoạt động',
    lastLogin: 'Hôm nay, 08:30',
  },
  {
    username: 'gov_mai',
    fullName: 'Trần Thị Mai',
    email: 'mai.tt@unilake.edu.vn',
    roles: ['DATA_GOVERNANCE'],
    status: 'Đang hoạt động',
    lastLogin: 'Hôm qua, 16:15',
  },
  {
    username: 'analyst_minh',
    fullName: 'Phạm Đức Minh',
    email: 'minh.pd@unilake.edu.vn',
    roles: ['DATA_ANALYST'],
    status: 'Đang hoạt động',
    lastLogin: 'Hôm qua, 14:02',
  },
  {
    username: 'academic_huong',
    fullName: 'Vũ Thu Hương',
    email: 'huong.vt@unilake.edu.vn',
    roles: ['ACADEMIC_ADMIN'],
    status: 'Đang hoạt động',
    lastLogin: '04/10/2026',
  },
  {
    username: 'staff_nam',
    fullName: 'Đặng Thành Nam',
    email: 'nam.dt@unilake.edu.vn',
    roles: ['USER'],
    status: 'Đang hoạt động',
    lastLogin: '02/10/2026',
  },
]

export function AdminView() {
  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Quản trị hệ thống & Phân quyền RBAC
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò SUPER_ADMIN — Quản lý tài khoản, gán role_code và giám
          sát hạ tầng.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Tổng người dùng
            </CardTitle>
            <Users className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">148</div>
            <p className="text-xs text-slate-500">+12 tài khoản trong tháng này</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Phiên hoạt động
            </CardTitle>
            <UserCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Tất cả token JWT hợp lệ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Nhóm vai trò (Roles)
            </CardTitle>
            <ShieldCheck className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-slate-500">SUPER_ADMIN, DE, GOV, ANALYST, ACAD, USER</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Tình trạng hệ thống
            </CardTitle>
            <Activity className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">99.98%</div>
            <p className="text-xs text-slate-500">Proxy & Backend dịch vụ ổn định</p>
          </CardContent>
        </Card>
      </div>

      {/* Users and Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Danh sách người dùng và Role Code gán
          </CardTitle>
          <CardDescription>
            Một người dùng có thể sở hữu nhiều vai trò song song. Phân quyền backend kiểm tra theo
            role_code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 pl-4 pr-3">Tài khoản</th>
                  <th className="p-3">Họ và tên</th>
                  <th className="p-3">Email trường</th>
                  <th className="p-3">Role Codes</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="py-3 pl-3 pr-4">Đăng nhập gần nhất</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sampleUsers.map((u) => (
                  <tr key={u.username} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {u.username}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      {u.fullName}
                    </td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge
                            key={r}
                            variant={r === 'SUPER_ADMIN' ? 'destructive' : 'secondary'}
                            className="font-mono text-[10px]"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-4 text-slate-400">{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
