import { ArrowRight, BookMarked, FileText, Info, Sparkles, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const announcements = [
  {
    title: 'Công bố số liệu tuyển sinh đại học chính quy đợt 1 năm 2026',
    date: '04/10/2026',
    tag: 'Tuyển sinh',
    readTime: '3 phút đọc',
  },
  {
    title: 'Cập nhật từ điển dữ liệu chuẩn hóa AUN-QA phiên bản 2.1',
    date: '01/10/2026',
    tag: 'Đào tạo',
    readTime: '5 phút đọc',
  },
  {
    title: 'Hướng dẫn sử dụng trợ lý NLQ AI tra cứu bảng dữ liệu tự nhiên',
    date: '28/09/2026',
    tag: 'Hướng dẫn',
    readTime: '4 phút đọc',
  },
]

export function HomeView() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-indigo-50 to-white p-6 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-sky-100 px-3 py-1 font-mono text-xs font-semibold text-sky-700 dark:bg-sky-950/80 dark:text-sky-300">
            <Sparkles className="size-3" />
            Cổng thông tin dữ liệu trường đại học
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Chào mừng bạn đến với UniLake AI
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Nền tảng Data Lake đa nguồn tích hợp AI Analytics dành cho cán bộ, giảng viên và sinh
            viên. Khám phá các báo cáo phân tích, chuẩn hóa dữ liệu theo chuẩn ISO và tương tác với
            dữ liệu qua giao diện số hóa.
          </p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Báo cáo sẵn sàng
            </CardTitle>
            <FileText className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 Báo cáo</div>
            <p className="text-xs text-slate-500">Tuyển sinh, Đào tạo, Khảo thí</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Chỉ số KPI đại học
            </CardTitle>
            <TrendingUp className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 Chỉ số</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Được đồng bộ hàng ngày từ tầng Gold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Quyền hạn hiện tại
            </CardTitle>
            <Info className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">USER</div>
            <p className="text-xs text-slate-500">
              Liên hệ Quản trị viên để cấp thêm vai trò chuyên biệt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Bản tin & Thông báo dữ liệu mới</CardTitle>
              <CardDescription>
                Cập nhật số liệu và tài liệu hướng dẫn mới nhất từ các phòng ban
              </CardDescription>
            </div>
            <BookMarked className="size-4 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {announcements.map((a) => (
              <div
                key={a.title}
                className="flex items-center justify-between py-3.5 transition-colors hover:text-sky-600"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-[10px]">
                    {a.tag}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {a.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>{a.date}</span>
                  <span>·</span>
                  <span>{a.readTime}</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
