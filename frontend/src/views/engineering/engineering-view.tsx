import { CheckCircle2, Database, HardDrive, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const medallionLayers = [
  {
    name: 'Bronze (Raw Layer)',
    badge: 'Tầng thô',
    color: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
    description: 'Chụp ảnh nguyên bản từ PostgreSQL nguồn và các tệp CSV nộp hồ sơ tuyển sinh.',
    tables: 'applicant_raw, admission_raw, lms_log_raw',
    storage: '4.8 GB',
  },
  {
    name: 'Silver (Conformed Layer)',
    badge: 'Tầng sạch',
    color: 'border-slate-400/30 bg-slate-400/5 text-slate-700 dark:text-slate-300',
    description: 'Lọc nhiễu, chuẩn hóa kiểu dữ liệu CCCD/Ngày sinh, khử trùng lặp và liên kết FK.',
    tables: 'student_clean, course_enrollment_clean',
    storage: '2.1 GB',
  },
  {
    name: 'Gold (Business Marts)',
    badge: 'Tầng nghiệp vụ',
    color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400',
    description:
      'Mô hình Star Schema phân tích tuyển sinh, KPI sinh viên phục vụ NLQ và Dashboards.',
    tables: 'fact_admission_kpi, dim_faculty, dim_program',
    storage: '820 MB',
  },
]

const pipelineJobs = [
  {
    id: 'job-01',
    name: 'admissions_daily_sync',
    source: 'PostgreSQL - Cổng Tuyển sinh',
    target: 'Bronze / Delta Parquet',
    cron: 'Hàng ngày lúc 02:00',
    status: 'Thành công',
    processed: '12,450 records',
    duration: '42s',
  },
  {
    id: 'job-02',
    name: 'student_enrollment_silver_etl',
    source: 'Bronze applicant_raw',
    target: 'Silver student_clean',
    cron: 'Mỗi 6 tiếng',
    status: 'Thành công',
    processed: '8,920 records',
    duration: '1m 14s',
  },
  {
    id: 'job-03',
    name: 'gold_kpi_admissions_aggregation',
    source: 'Silver student_clean',
    target: 'Gold fact_admission_kpi',
    cron: 'Hàng ngày lúc 04:30',
    status: 'Thành công',
    processed: '4,500 records',
    duration: '28s',
  },
]

export function EngineeringView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kỹ thuật dữ liệu & Kiến trúc Medallion
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò DATA_ENGINEER — Quản lý ETL Pipeline, tầng lưu trữ
          Bronze / Silver / Gold và hạ tầng DuckDB/MinIO.
        </p>
      </div>

      {/* Infrastructure Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              DuckDB OLAP Engine
            </CardTitle>
            <Database className="size-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">Phiên bản 1.1.0</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              In-memory analytical query: Sẵn sàng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              MinIO S3 Data Lake
            </CardTitle>
            <HardDrive className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">7.72 GB Parquet</div>
            <p className="text-xs text-slate-500">3 buckets: unilake-bronze, silver, gold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">
              Trạng thái ETL Ingestion
            </CardTitle>
            <RefreshCw className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              100% Hoàn thành
            </div>
            <p className="text-xs text-slate-500">0 lỗi ghi nhận trong 24h qua</p>
          </CardContent>
        </Card>
      </div>

      {/* Medallion Architecture Cards */}
      <div>
        <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
          Cấu trúc lưu trữ Medallion Lake
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          {medallionLayers.map((layer) => (
            <Card key={layer.name} className={`border ${layer.color}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-medium">
                    {layer.badge}
                  </Badge>
                  <span className="font-mono text-xs font-semibold">{layer.storage}</span>
                </div>
                <CardTitle className="text-sm font-bold">{layer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-slate-600 dark:text-slate-300">{layer.description}</p>
                <div className="rounded bg-white/70 p-2 dark:bg-slate-900/60">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">
                    Bảng mẫu:
                  </span>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {layer.tables}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pipelines Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Danh sách luồng Ingestion & ETL</CardTitle>
          <CardDescription>
            Các tiến trình nạp và chuyển đổi dữ liệu tự động định kỳ vào kho dữ liệu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs tabular-nums">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="py-3 pl-4 pr-3">Tên Pipeline</th>
                  <th className="p-3">Nguồn</th>
                  <th className="p-3">Đích đến</th>
                  <th className="p-3">Tần suất</th>
                  <th className="p-3">Bản ghi</th>
                  <th className="p-3">Thời gian</th>
                  <th className="py-3 pl-3 pr-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pipelineJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 pl-4 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {j.name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{j.source}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{j.target}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{j.cron}</td>
                    <td className="p-3 font-mono font-medium">{j.processed}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{j.duration}</td>
                    <td className="py-3 pl-3 pr-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        {j.status}
                      </span>
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
