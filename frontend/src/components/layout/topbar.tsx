'use client'

import Link from 'next/link'

import { Bell, Building2, ChevronDown, Menu, Search, Sparkles } from 'lucide-react'

import { getDomain } from '@/config/domains'
import { ASK_AI_PATHS } from '@/config/menu'
import { ROLE_DEFINITIONS } from '@/config/roles'
import type { RoleCode } from '@/types/auth'

import { DomainSelector } from './domain-selector'
import { UserMenu } from './user-menu'

interface TopbarProps {
  role: RoleCode
  onOpenMobile?: () => void
}

export function Topbar({ role, onOpenMobile }: TopbarProps) {
  const askAiPath = ASK_AI_PATHS[role]
  const roleDefinition = ROLE_DEFINITIONS[role]
  const lockedDomain = roleDefinition.domain ? getDomain(roleDefinition.domain) : null

  return (
    <header className="glass-panel sticky top-3 z-30 mt-3 flex min-h-16 shrink-0 items-center gap-2 rounded-[1.6rem] px-3 py-2 sm:gap-3 md:px-4">
      <button
        type="button"
        onClick={onOpenMobile}
        className="glass-control flex size-10 shrink-0 items-center justify-center rounded-2xl text-slate-700 md:hidden"
        aria-label="Mở menu điều hướng"
      >
        <Menu className="size-4" />
      </button>

      <div className="hidden min-w-0 shrink-0 flex-col sm:flex">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-500">
          Workspace
        </span>
        <span className="max-w-48 truncate text-sm font-extrabold tracking-tight text-slate-900">
          {roleDefinition.workspaceLabel}
        </span>
      </div>

      <div className="hidden h-8 w-px shrink-0 bg-white/80 sm:block" />

      <label className="glass-control hidden h-10 min-w-48 max-w-md flex-1 items-center gap-2 rounded-2xl px-3 text-slate-500 lg:flex">
        <Search className="size-4 shrink-0" />
        <span className="sr-only">Tìm kiếm trong hệ thống</span>
        <input
          type="search"
          placeholder="Tìm dữ liệu, báo cáo, hồ sơ…"
          className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
        />
        <kbd className="rounded-lg border border-white/80 bg-white/60 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
          ⌘ K
        </kbd>
      </label>

      <div className="flex-1 lg:hidden" />

      {lockedDomain ? (
        <div className="glass-control hidden h-10 items-center gap-2 rounded-2xl px-3 text-xs font-semibold text-slate-700 sm:flex">
          <Building2 className="size-3.5 text-indigo-500" />
          {lockedDomain.shortLabel}
        </div>
      ) : (
        <DomainSelector />
      )}

      <div className="hidden h-8 shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 xl:flex">
        <Building2 className="size-3.5 text-slate-500" />
        Toàn trường (Tất cả đơn vị)
        <ChevronDown className="size-3.5 text-slate-400" />
      </div>

      {askAiPath && (
        <Link
          href={askAiPath}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl bg-slate-950 px-3.5 text-xs font-bold text-white shadow-[0_8px_22px_rgba(15,23,42,0.18)] transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="size-3.5" />
          <span className="hidden sm:inline">Hỏi AI</span>
          <span className="sm:hidden">AI</span>
        </Link>
      )}

      <button
        type="button"
        className="glass-control relative hidden size-10 shrink-0 items-center justify-center rounded-2xl text-slate-600 sm:flex"
        aria-label="Thông báo hệ thống"
      >
        <Bell className="size-4" />
      </button>

      <UserMenu role={role} />
    </header>
  )
}
