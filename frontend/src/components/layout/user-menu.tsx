'use client'

import Link from 'next/link'

import { Check, ChevronDown, LogOut, Settings, Shield, User } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROLE_DEFINITIONS, ROLE_PRIORITY, ROLE_ROUTE_PREFIXES } from '@/config/roles'
import { useAuth } from '@/hooks/use-auth'
import type { RoleCode } from '@/types/auth'

interface UserMenuProps {
  /** Vai trò của không gian làm việc đang mở */
  role: RoleCode
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'U'
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase()
  return `${words[words.length - 2]![0]}${words[words.length - 1]![0]}`.toUpperCase()
}

export function UserMenu({ role }: UserMenuProps) {
  const { user, roles, logout, isLoggingOut } = useAuth()
  const roleDef = ROLE_DEFINITIONS[role]
  const displayName = user?.fullName ?? user?.username ?? roleDef.sampleUser
  const secondaryLine = user?.email ?? user?.username ?? roleDef.workspaceLabel
  // Giữ thứ tự ưu tiên vai trò để danh sách không nhảy khi token đổi thứ tự.
  const switchableRoles = ROLE_PRIORITY.filter((item) => roles.includes(item))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Mở menu người dùng"
        className="glass-control flex min-h-10 items-center gap-2 rounded-2xl py-1 pl-1 pr-2 text-left transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-200 via-violet-100 to-rose-100 text-[10px] font-extrabold text-indigo-700 shadow-inner">
          {getInitials(displayName)}
        </span>
        <span className="hidden min-w-0 flex-col lg:flex">
          <span className="flex items-center gap-1.5">
            <span className="max-w-40 truncate text-xs font-semibold text-slate-900">
              {displayName}
            </span>
          </span>
          <span className="truncate text-[10px] text-slate-500">{roleDef.name}</span>
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl border-white/80 bg-white/90 p-2 shadow-[0_24px_70px_rgba(71,75,110,0.2)] backdrop-blur-2xl"
      >
        <div className="space-y-0.5 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
              {displayName}
            </p>
            <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-px font-mono text-[10px] font-bold text-indigo-700">
              [{role}]
            </span>
          </div>
          <p className="truncate font-mono text-[10px] font-medium text-slate-500">
            {secondaryLine}
          </p>
          <p className="text-[11px] text-slate-600">{roleDef.description}</p>
        </div>
        {switchableRoles.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-mono text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Chuyển không gian làm việc
            </DropdownMenuLabel>
            {switchableRoles.map((item) => {
              const selected = item === role
              return (
                <DropdownMenuItem
                  key={item}
                  asChild
                  className={
                    selected
                      ? 'bg-indigo-50 text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700'
                      : 'text-slate-700'
                  }
                >
                  <Link href={ROLE_ROUTE_PREFIXES[item]}>
                    <Shield className={selected ? 'text-indigo-600' : 'text-slate-500'} />
                    <span className="flex-1">{ROLE_DEFINITIONS[item].name}</span>
                    {selected && <Check className="text-indigo-600" aria-label="Đang mở" />}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-slate-700">
          <User className="text-slate-500" />
          Hồ sơ cá nhân
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-slate-700">
          <Settings className="text-slate-500" />
          Cài đặt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoggingOut}
          onSelect={() => logout()}
          className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
        >
          <LogOut />
          {isLoggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
