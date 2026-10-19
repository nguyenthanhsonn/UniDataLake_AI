import { BookOpen, CheckCircle2, Database, GitBranch, HardDrive, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

export function DataView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Kỹ thuật & Quản trị Dữ liệu
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không gian dành riêng cho vai trò DATA_ADMIN — Quản lý ETL Pipeline, tầng lưu trữ
          Medallion và Data Catalog quản trị dữ liệu trường đại học.
        </p>
      </div>

      <Tabs defaultValue="engineering" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="engineering" className="flex items-center gap-2">
            <GitBranch className="size-4" />
            Kỹ thuật dữ liệu & Pipeline
          </TabsTrigger>
          <TabsTrigger value="governance" className="flex items-center gap-2">
            <BookOpen className="size-4" />
            Quản trị & Data Catalog
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Engineering */}
        <TabsContent value="engineering" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                  Lưu trữ Medallion
                </CardTitle>
                <Database className="size-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.72 GB</div>
                <p className="text-xs text-slate-500">MinIO S3 Bucket (Bronze/Silver/Gold)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                  Pipelines hoạt động
                </CardTitle>
                <RefreshCw className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3 / 3 Active</div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Tất cả job chạy đúng lịch trình
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-slate-500">
                  DuckDB Engine
                </CardTitle>
                <HardDrive className="size-4 text-indigo-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">v1.1.0</div>
                <p className="text-xs text-slate-500">Local Vectorized Processing</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {medallionLayers.map((layer) => (
              <Card key={layer.name} className={`border ${layer.color}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">{layer.name}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {layer.badge}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{layer.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Bảng tiêu biểu:
                    </span>{' '}
                    <span className="font-mono text-slate-500">{layer.tables}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Dung lượng:
                    </span>{' '}
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {layer.storage}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Tiến trình Ingestion & ETL gần nhất
              </CardTitle>
              <CardDescription>
                Lịch sử thực thi các tác vụ đồng bộ dữ liệu vào Data Lake
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 pl-4 pr-3">Job ID</th>
                      <th className="p-3">Tên tác vụ</th>
                      <th className="p-3">Nguồn</th>
                      <th className="p-3">Đích</th>
                      <th className="p-3">Số dòng</th>
                      <th className="p-3">Thời gian</th>
                      <th className="py-3 pl-3 pr-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pipelineJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 pl-4 pr-3 font-mono text-slate-500">{j.id}</td>
                        <td className="p-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {j.name}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{j.source}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{j.target}</td>
                        <td className="p-3 font-mono">{j.processed}</td>
                        <td className="p-3 text-slate-500">{j.duration}</td>
                        <td className="py-3 pl-3 pr-4">
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
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
        </TabsContent>

        {/* Tab 2: Governance */}
        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Data Catalog & Phân loại dữ liệu (PII)
              </CardTitle>
              <CardDescription>
                Danh mục thực thể dữ liệu được kiểm định chất lượng và phân quyền bảo vệ thông tin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs tabular-nums">
                  <thead className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 pl-4 pr-3">Bảng dữ liệu</th>
                      <th className="p-3">Lĩnh vực</th>
                      <th className="p-3">Phân loại</th>
                      <th className="p-3">Số cột</th>
                      <th className="p-3">Điểm DQ</th>
                      <th className="p-3">Đơn vị chủ quản</th>
                      <th className="py-3 pl-3 pr-4">Trường PII nhạy cảm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {catalogAssets.map((asset) => (
                      <tr
                        key={asset.table}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3 pl-4 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100">
                          {asset.table}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{asset.domain}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              asset.classification.includes('Confidential')
                                ? 'destructive'
                                : asset.classification === 'Internal'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="text-[10px]"
                          >
                            {asset.classification}
                          </Badge>
                        </td>
                        <td className="p-3 font-mono">{asset.columns}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {asset.dqScore}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{asset.owner}</td>
                        <td className="py-3 pl-3 pr-4 font-mono text-[11px] text-slate-500">
                          {asset.piiFields}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { DataView as EngineeringView, DataView as GovernanceView }
