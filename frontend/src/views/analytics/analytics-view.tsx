import { BarChart3, Bot, ChevronRight, FileSearch, Sparkles, Terminal } from 'lucide-react'

import { BarChartCard } from '@/components/charts/bar-chart-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const admissionsData = [
  { label: 'THPT', value: 4200 },
  { label: 'Học bạ', value: 2850 },
  { label: 'ĐGNL', value: 1640 },
  { label: 'Tuyển thẳng', value: 310 },
  { label: 'Chứng chỉ QT', value: 450 },
]

const sampleQueries = [
  {
    prompt: 'Thống kê số lượng thí sinh trúng tuyển theo phương thức xét tuyển 2025',
    sql: 'SELECT method_code, COUNT(*) AS admitted_count FROM gold.fact_admission_kpi GROUP BY method_code ORDER BY admitted_count DESC;',
    latency: '18ms',
  },
  {
    prompt: 'Top 5 ngành học có điểm chuẩn trung bình cao nhất 3 năm qua',
    sql: 'SELECT program_name, ROUND(AVG(admission_score), 2) AS avg_score FROM gold.fact_admission_kpi GROUP BY program_name ORDER BY avg_score DESC LIMIT 5;',
    latency: '24ms',
  },
]

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Phân tích dữ liệu & Trợ lý NLQ AI
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò DATA_ANALYST — Truy vấn dữ liệu tự nhiên, sinh SQL tự
          động qua DuckDB và trực quan hóa KPI.
        </p>
      </div>

      {/* NLQ Feature Spotlight */}
      <Card className="border-sky-500/30 bg-gradient-to-r from-sky-500/5 via-indigo-500/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500 text-white shadow-sm">
              <Bot className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                Trợ lý NLQ AI - Hỏi dữ liệu bằng tiếng Việt
              </CardTitle>
              <CardDescription>
                Mô hình AI tự động dịch câu hỏi ngôn ngữ tự nhiên sang câu lệnh SQL DuckDB chỉ đọc
                (Read-only).
              </CardDescription>
            </div>
            <Badge className="ml-auto bg-sky-500 text-white hover:bg-sky-600">
              <Sparkles className="mr-1 size-3" /> AI Engine
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="shadow-xs flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
            <FileSearch className="size-4 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              Ví dụ truy vấn: &ldquo;So sánh chỉ tiêu và số sinh viên nhập học ngành Công nghệ Thông
              tin giai đoạn 2023 - 2025&rdquo;
            </span>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1 rounded bg-sky-600 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-700"
            >
              Chạy truy vấn <ChevronRight className="size-3" />
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Lịch sử truy vấn được tối ưu gần đây:
            </span>
            {sampleQueries.map((q) => (
              <div
                key={q.prompt}
                className="rounded-md border border-slate-200/80 bg-slate-50/60 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                  <span>💬 {q.prompt}</span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    DuckDB: {q.latency}
                  </Badge>
                </div>
                <div className="mt-2 flex items-start gap-2 rounded bg-slate-900 p-2 font-mono text-[11px] text-emerald-400">
                  <Terminal className="mt-0.5 size-3 text-slate-400" />
                  <code>{q.sql}</code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics Chart */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold">
                Phân bố hồ sơ đăng ký theo phương thức
              </CardTitle>
              <BarChart3 className="size-4 text-sky-500" />
            </div>
            <CardDescription>Số lượng hồ sơ tuyển sinh đợt 1 năm học 2025-2026</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartCard data={admissionsData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Chỉ số phân tích nhanh (KPIs)</CardTitle>
            <CardDescription>Số liệu tổng hợp trích xuất từ tầng Gold Marts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs tabular-nums">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-500">Tổng hồ sơ nộp vào hệ thống:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                9,450 hồ sơ
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-500">Tỷ lệ xác nhận nhập học:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                89.4%
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-500">Điểm chuẩn trung bình toàn trường:</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">24.65 điểm</span>
            </div>
            <div className="flex items-center justify-between pb-2">
              <span className="text-slate-500">Tốc độ phản hồi trung bình DuckDB:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                21.5 ms
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
