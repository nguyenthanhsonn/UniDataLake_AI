'use client'

import { Bell, Database, Menu, Shield } from 'lucide-react'

import { ROLE_DEFINITIONS } from '@/config/roles'
import { useAuth } from '@/hooks/use-auth'
import type { RoleCode } from '@/types/auth'

interface TopbarProps {
  role: RoleCode
  onOpenMobile?: () => void
}

export function Topbar({ role, onOpenMobile }: TopbarProps) {
  const { user } = useAuth()
  const roleDef = ROLE_DEFINITIONS[role]

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="size-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            UniDataLake AI
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">{roleDef.name}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Lake status indicator */}
        <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/70 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          <Database className="size-3" />
          <span>Medallion Lake: Sẵn sàng</span>
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Shield className="size-3.5 text-sky-500" />
          <span className="font-mono text-[11px]">{role}</span>
        </div>

        {/* Notification icon */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Thông báo hệ thống"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-sky-500" />
        </button>

        {/* User initials */}
        <div className="flex size-9 items-center justify-center rounded-lg bg-sky-600 font-mono text-xs font-bold text-white shadow-sm">
          {user?.username?.slice(0, 2).toUpperCase() ?? 'UD'}
        </div>
      </div>
    </header>
  )
}
