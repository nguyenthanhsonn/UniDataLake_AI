import Image from 'next/image'
import Link from 'next/link'

import { ArrowUpRight, CheckCircle2, Clock3, FileCheck2, Sparkles, Users2 } from 'lucide-react'

import {
  Button,
  Card,
  KpiCard,
  MockNotice,
  PageHeader,
  ProgressRow,
  Tag,
} from '@/components/page/page-parts'
import { ROLE_DEFINITIONS } from '@/config/roles'
import type { WorkspaceConfig, WorkspaceView } from '@/config/workspaces'

import type { LucideIcon } from 'lucide-react'

const QUEUE_ROWS = [
  { code: 'HS-2026-01842', owner: 'Tô Loan', state: 'Chờ xử lý', time: '08:32' },
  { code: 'HS-2026-01837', owner: 'Nguyễn Toàn', state: 'Đang kiểm tra', time: '09:15' },
  { code: 'HS-2026-01821', owner: 'Trí Đức', state: 'Cần bổ sung', time: '10:04' },
  { code: 'HS-2026-01809', owner: 'Nguyễn Đăng Quang Huy', state: 'Hoàn tất', time: '10:48' },
]

const SIGNALS: { label: string; icon: LucideIcon; tone: string }[] = [
  { label: '12 hồ sơ cần bổ sung', icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
  { label: '08 mục chờ phê duyệt', icon: FileCheck2, tone: 'text-indigo-600 bg-indigo-50' },
  {
    label: 'Đồng bộ dữ liệu ổn định',
    icon: CheckCircle2,
    tone: 'text-emerald-600 bg-emerald-50',
  },
]

function WorkspaceHero({ config, base }: { config: WorkspaceConfig; base: string }) {
  const role = ROLE_DEFINITIONS[config.role]
  return (
    <div className="glass-panel-strong relative overflow-hidden rounded-[1.8rem] p-5 md:p-7">
      <div className="absolute -right-14 -top-20 size-64 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <Tag tone={config.accent}>Live workspace</Tag>
          <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">
            Chào {role.sampleUser}, hôm nay bạn muốn ưu tiên điều gì?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Theo dõi {config.recordLabel}, phát hiện điểm cần chú ý và xử lý công việc ngay trong
            một không gian thống nhất.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`${base}/ask`}>
              <Button variant="primary" icon={<Sparkles className="size-3.5" />}>
                Hỏi UniLake AI
              </Button>
            </Link>
            <Link href={config.scope === 'manager' ? `${base}/approvals` : `${base}/records`}>
              <Button>Xem hàng đợi</Button>
            </Link>
          </div>
        </div>
        <Image
          src="/assets/ui/ai-spark-sticker.png"
          alt=""
          width={150}
          height={150}
          className="mx-auto size-28 object-contain md:mx-0 md:size-36"
        />
      </div>
    </div>
  )
}

function QueueTable({ config }: { config: WorkspaceConfig }) {
  return (
    <Card
      title={`Hàng đợi ${config.recordLabel}`}
      subtitle="Cập nhật gần nhất vài phút trước"
      right={<Tag tone="indigo">{QUEUE_ROWS.length} mục mới</Tag>}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-xs">
          <thead className="bg-white/35 text-[9px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3">Mã hồ sơ</th>
              <th className="px-5 py-3">Phụ trách</th>
              <th className="px-5 py-3">Trạng thái</th>
              <th className="px-5 py-3">Cập nhật</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {QUEUE_ROWS.map((row, index) => (
              <tr key={row.code} className="border-t border-white/70 hover:bg-white/45">
                <td className="px-5 py-3.5 font-bold text-slate-800">{row.code}</td>
                <td className="px-5 py-3.5 text-slate-600">{row.owner}</td>
                <td className="px-5 py-3.5">
                  <Tag tone={index === 3 ? 'emerald' : index === 2 ? 'amber' : 'indigo'}>
                    {row.state}
                  </Tag>
                </td>
                <td className="px-5 py-3.5 text-slate-500">{row.time}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    className="rounded-xl p-2 text-indigo-600 hover:bg-indigo-50"
                    aria-label={`Mở ${row.code}`}
                  >
                    <ArrowUpRight className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function AnalyticsPanel({ config }: { config: WorkspaceConfig }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card title={`Tiến độ ${config.label}`} subtitle="Mức hoàn thành theo nhóm nghiệp vụ">
        <div className="space-y-5 py-1">
          <ProgressRow label="Tiếp nhận & chuẩn hoá" value="86%" percent={86} tone="indigo" />
          <ProgressRow label="Xác minh dữ liệu" value="72%" percent={72} tone="emerald" />
          <ProgressRow label="Phê duyệt nghiệp vụ" value="61%" percent={61} tone="amber" />
          <ProgressRow label="Đồng bộ Gold mart" value="94%" percent={94} tone="indigo" />
        </div>
      </Card>
      <Card title="Tín hiệu cần chú ý" subtitle="UniLake AI tổng hợp trong ngày">
        <div className="space-y-3">
          {SIGNALS.map(({ label, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/45 p-3"
            >
              <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-4" />
              </span>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function RoleWorkspaceView({
  config,
  view,
}: {
  config: WorkspaceConfig
  view?: WorkspaceView
}) {
  const role = ROLE_DEFINITIONS[config.role]
  const base = `/workspaces/${config.domain}/${config.scope}`
  const isManager = config.scope === 'manager'
  const pageTitle =
    view === 'approvals'
      ? 'Phê duyệt nghiệp vụ'
      : view === 'analytics'
        ? 'Phân tích & So sánh'
        : view === 'records'
          ? `Danh sách ${config.recordLabel}`
          : view === 'detail'
            ? 'Chi tiết & Xử lý'
            : isManager
              ? `Điều hành ${config.label}`
              : `Công việc ${config.label}`

  if (view) {
    return (
      <div className="space-y-5">
        <PageHeader
          breadcrumb={[config.label, role.name, pageTitle]}
          title={pageTitle}
          description={`Không gian ${role.name.toLowerCase()} dành cho ${role.sampleUser}.`}
          actions={
            <Link href={`${base}/ask`}>
              <Button variant="soft" icon={<Sparkles className="size-3.5" />}>
                Hỏi AI về trang này
              </Button>
            </Link>
          }
        />
        <MockNotice api={`GET /workspace/${config.domain}/${config.scope}/${view}`} />
        {(view === 'analytics' || view === 'detail') && <AnalyticsPanel config={config} />}
        {(view === 'approvals' || view === 'records' || view === 'detail') && (
          <QueueTable config={config} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumb={[config.label, role.name]}
        title={`${config.label} Workspace`}
        description={role.description}
      />
      <WorkspaceHero config={config} base={base} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={config.metricLabels[0]}
          value={isManager ? '1.842' : '28'}
          hint="+12% so với tuần trước"
          tone="indigo"
        />
        <KpiCard
          label={config.metricLabels[1]}
          value={isManager ? '1.426' : '19'}
          hint="Đúng SLA"
          tone="emerald"
        />
        <KpiCard
          label={config.metricLabels[2]}
          value={isManager ? '47' : '06'}
          hint="Cần xử lý hôm nay"
          tone="amber"
        />
        <KpiCard label={config.metricLabels[3]} value="86,4%" hint="+3,1 điểm" tone="emerald" />
      </div>
      <AnalyticsPanel config={config} />
      <QueueTable config={config} />
      <div className="glass-panel flex items-center gap-3 rounded-[1.4rem] p-4 text-xs text-slate-600">
        <Users2 className="size-4 text-indigo-500" />
        Không gian này áp dụng quyền <strong className="text-slate-800">{config.role}</strong>; dữ
        liệu được giới hạn theo phạm vi {config.label}.
      </div>
    </div>
  )
}
