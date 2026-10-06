import { BookOpen, GraduationCap, School, UserPlus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const programs = [
  {
    code: '7480201',
    name: 'Công nghệ Thông tin',
    faculty: 'Khoa CNTT',
    quota: 450,
    admitted: 442,
    status: 'Đạt chỉ tiêu',
  },
  {
    code: '7480109',
    name: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo',
    faculty: 'Khoa Toán - Tin',
    quota: 180,
    admitted: 180,
    status: 'Đạt chỉ tiêu',
  },
  {
    code: '7340101',
    name: 'Quản trị Kinh doanh',
    faculty: 'Khoa Quản trị',
    quota: 320,
    admitted: 315,
    status: 'Đang tuyển bổ sung',
  },
  {
    code: '7520216',
    name: 'Kỹ thuật Điều khiển & Tự động hóa',
    faculty: 'Khoa Cơ điện tử',
    quota: 220,
    admitted: 218,
    status: 'Đạt chỉ tiêu',
  },
]

export function AcademicView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Quản trị đào tạo & Học vụ
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò ACADEMIC_ADMIN — Quản lý công tác tuyển sinh, chương
          trình đào tạo và theo dõi sinh viên chính quy.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Sinh viên chính quy
            </CardTitle>
            <GraduationCap className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14,820</div>
            <p className="text-xs text-slate-500">Đang theo học tại 28 chuyên ngành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Chỉ tiêu tuyển sinh 2026
            </CardTitle>
            <UserPlus className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,600</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Đã đạt 97.2% chỉ tiêu đợt 1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Chương trình đào tạo
            </CardTitle>
            <BookOpen className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-slate-500">Chuẩn đầu ra kiểm định AUN-QA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Khoa / Viện trực thuộc
            </CardTitle>
            <School className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 Khoa</div>
            <p className="text-xs text-slate-500">Tổng cộng 450 giảng viên cơ hữu</p>
          </CardContent>
        </Card>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Tình hình chỉ tiêu tuyển sinh theo ngành
          </CardTitle>
          <CardDescription>
            Theo dõi tiến độ nhập học và số lượng hồ sơ theo từng chương trình đào tạo năm
            2025-2026.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 pl-4 pr-3">Mã ngành</th>
                  <th className="p-3">Tên chương trình đào tạo</th>
                  <th className="p-3">Khoa phụ trách</th>
                  <th className="p-3">Chỉ tiêu</th>
                  <th className="p-3">Đã nhập học</th>
                  <th className="py-3 pl-3 pr-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {programs.map((p) => (
                  <tr key={p.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {p.code}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{p.faculty}</td>
                    <td className="p-3 font-mono">{p.quota}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.admitted}
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <Badge
                        variant={p.status === 'Đạt chỉ tiêu' ? 'secondary' : 'outline'}
                        className="text-[10px]"
                      >
                        {p.status}
                      </Badge>
                    </td>
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
