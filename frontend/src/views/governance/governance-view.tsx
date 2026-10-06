import { BookOpen, CheckCircle, Lock, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const catalogAssets = [
  {
    table: 'applicant',
    domain: 'Tuyển sinh',
    classification: 'Confidential (PII)',
    columns: 10,
    dqScore: '99.4%',
    owner: 'Phòng Tuyển sinh',
    piiFields: 'national_id, phone, email, date_of_birth',
  },
  {
    table: 'admission',
    domain: 'Tuyển sinh',
    classification: 'Internal',
    columns: 8,
    dqScore: '98.8%',
    owner: 'Phòng Tuyển sinh',
    piiFields: 'None',
  },
  {
    table: 'student',
    domain: 'Đào tạo',
    classification: 'Confidential (PII)',
    columns: 12,
    dqScore: '99.1%',
    owner: 'Phòng Đào tạo',
    piiFields: 'student_code, full_name, phone',
  },
  {
    table: 'enrollment',
    domain: 'Đào tạo',
    classification: 'Internal',
    columns: 6,
    dqScore: '97.9%',
    owner: 'Phòng Đào tạo',
    piiFields: 'None',
  },
  {
    table: 'course_offering',
    domain: 'Đào tạo',
    classification: 'Public',
    columns: 9,
    dqScore: '100%',
    owner: 'Khoa / Viện',
    piiFields: 'None',
  },
]

export function GovernanceView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Quản trị dữ liệu & Data Catalog
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò DATA_GOVERNANCE — Quản lý từ điển siêu dữ liệu, phân
          loại PII, bảo mật và chỉ số chất lượng dữ liệu (DQ).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Tổng số bảng Catalog
            </CardTitle>
            <BookOpen className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24 Bảng</div>
            <p className="text-xs text-slate-500">Phủ kín 3 phân hệ cốt lõi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Điểm chất lượng DQ trung bình
            </CardTitle>
            <CheckCircle className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">98.8%</div>
            <p className="text-xs text-slate-500">Đạt ngưỡng tiêu chuẩn quản trị đại học</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Trường dữ liệu PII
            </CardTitle>
            <Lock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">18 Cột</div>
            <p className="text-xs text-slate-500">Đã kích hoạt che mờ & mã hóa phân quyền</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Chính sách tuân thủ
            </CardTitle>
            <ShieldCheck className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ISO 27001</div>
            <p className="text-xs text-slate-500">Phù hợp Nghị định 13/2023/NĐ-CP</p>
          </CardContent>
        </Card>
      </div>

      {/* Catalog Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Data Catalog & Phân loại bảo mật</CardTitle>
          <CardDescription>
            Danh mục thực thể dữ liệu đã được đăng ký và gắn nhãn phân quyền truy cập.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 pl-4 pr-3">Tên Bảng</th>
                  <th className="p-3">Phân hệ</th>
                  <th className="p-3">Mức phân loại</th>
                  <th className="p-3">Số cột</th>
                  <th className="p-3">Điểm DQ</th>
                  <th className="p-3">Đơn vị phụ trách</th>
                  <th className="py-3 pl-3 pr-4">Trường PII bảo vệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {catalogAssets.map((asset) => (
                  <tr key={asset.table} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {asset.table}
                    </td>
                    <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                      {asset.domain}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={asset.classification.includes('PII') ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {asset.classification}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono">{asset.columns}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {asset.dqScore}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{asset.owner}</td>
                    <td className="py-3 pl-3 pr-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {asset.piiFields}
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
