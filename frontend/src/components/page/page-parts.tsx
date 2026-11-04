import type { ReactNode } from 'react'

import Image from 'next/image'

import { ChevronRight, CircleAlert, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Khung trang theo Figma: breadcrumb, tiêu đề, mô tả và nhóm nút bên phải. */
export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb: string[]
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 space-y-1.5">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
            {breadcrumb.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
                <span className={index === breadcrumb.length - 1 ? 'text-indigo-600' : undefined}>
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-[-0.035em] text-slate-950 md:text-[2.05rem]">
          {title}
        </h1>
        {description && (
          <p className="max-w-3xl text-[13px] leading-5 text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  title,
  subtitle,
  right,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('glass-panel overflow-hidden rounded-[1.55rem]', className)}>
      {(title || right) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-white/80 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold tracking-tight text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  tone = 'slate',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
}) {
  return (
    <div className="glass-panel rounded-[1.45rem] p-5 transition-transform hover:-translate-y-0.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold -tracking-wide text-slate-950">{value}</p>
      {hint && <p className={cn('mt-1 text-[11px]', HINT_TONE[tone])}>{hint}</p>}
    </div>
  )
}

export type Tone = 'slate' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'

const TAG_TONE: Record<Tone, string> = {
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
}

const HINT_TONE: Record<Tone, string> = {
  slate: 'text-slate-500',
  indigo: 'text-indigo-600',
  emerald: 'text-emerald-600',
  amber: 'text-amber-600',
  rose: 'text-rose-600',
  sky: 'text-sky-600',
}

export function Tag({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        TAG_TONE[tone]
      )}
    >
      {children}
    </span>
  )
}

/** Màu nhãn theo trạng thái job/nguồn/truy vấn trả về từ backend. */
export function statusTone(status: string | null | undefined): Tone {
  switch ((status ?? '').toUpperCase()) {
    case 'SUCCESS':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'PUBLISHED':
    case 'PASSED':
      return 'emerald'
    case 'RUNNING':
    case 'QUEUED':
    case 'PROCESSING':
    case 'BRONZE':
      return 'amber'
    case 'FAILED':
    case 'REJECTED':
    case 'PERMISSION_DENIED':
    case 'VALIDATION_FAILED':
      return 'rose'
    case 'SILVER':
      return 'slate'
    case 'GOLD':
      return 'amber'
    default:
      return 'slate'
  }
}

export function ProgressRow({
  label,
  value,
  percent,
  tone = 'indigo',
}: {
  label: ReactNode
  value: ReactNode
  percent: number
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose'
}) {
  const fill = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  }[tone]
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-white/70 shadow-inner">
        <div
          className={cn('h-2 rounded-full', fill)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  )
}

export function Button({
  children,
  variant = 'outline',
  icon,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'soft' | 'ghost'
  icon?: ReactNode
}) {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-600/60',
    outline: 'glass-control text-slate-700 hover:bg-white/80',
    soft: 'border border-indigo-200/70 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80',
    ghost: 'text-slate-600 hover:bg-white/60',
  }[variant]
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl px-3.5 text-xs font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70',
        styles,
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

export function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="glass-control inline-flex h-9 items-center gap-1 rounded-2xl px-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </span>
  )
}

export function LoadingState({ label = 'Đang tải dữ liệu…' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"
      role="status"
    >
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  requestId,
}: {
  message: string
  onRetry?: () => void
  /** Mã request_id backend trả về, hiển thị để người dùng báo lại khi cần tra log. */
  requestId?: string
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-[1.4rem] border border-rose-200/80 bg-rose-50/70 px-4 py-7 text-center backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
        <CircleAlert className="size-4" aria-hidden="true" />
        {message}
      </div>
      {requestId && <p className="font-mono text-[11px] text-rose-600">Mã tra cứu: {requestId}</p>}
      {onRetry && (
        <Button onClick={onRetry} icon={<RefreshCw className="size-3.5" aria-hidden="true" />}>
          Thử lại
        </Button>
      )}
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-10 text-center">
      <div className="relative mb-1 size-16">
        <Image
          src="/assets/ui/ai-spark-sticker.png"
          alt=""
          fill
          sizes="64px"
          className="object-contain"
        />
        <Inbox
          className="absolute bottom-0 right-0 size-5 rounded-full bg-white p-1 text-slate-400 shadow"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="max-w-md text-xs text-slate-500">{description}</p>}
    </div>
  )
}

/** Ghi chú nhỏ cho biết số liệu đang là dữ liệu mẫu vì backend chưa có API tương ứng. */
export function MockNotice({ api }: { api: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/70 px-3 py-2 text-[11px] text-amber-800 backdrop-blur-xl">
      Đang hiển thị dữ liệu mẫu theo thiết kế. Backend chưa có{' '}
      <code className="font-mono">{api}</code>; sẽ nối khi API sẵn sàng.
    </p>
  )
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  // Backend lưu UTC không kèm timezone (xem docs/udl-12-ingestion-handover.md).
  const normalized = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('vi-VN')
}
