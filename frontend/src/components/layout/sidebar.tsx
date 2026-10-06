'use client'

import type { ComponentType } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  Database,
  FileBarChart,
  FileText,
  GitBranch,
  GraduationCap,
  HardDrive,
  History,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Table,
  UserPlus,
  Users,
} from 'lucide-react'

import { ROLE_MENUS } from '@/config/menu'
import { ROLE_DEFINITIONS, ROLE_ROUTE_PREFIXES } from '@/config/roles'
import { useAuth } from '@/hooks/use-auth'
import type { RoleCode } from '@/types/auth'

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  FileText,
  GitBranch,
  Database,
  Layers,
  HardDrive,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  Bot,
  BarChart3,
  Table,
  History,
  GraduationCap,
  UserPlus,
  Home,
  FileBarChart,
  Search,
}

interface SidebarProps {
  role: RoleCode
  onCloseMobile?: () => void
}

export function Sidebar({ role, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const { user, roles, logout, isLoggingOut } = useAuth()
  const roleDef = ROLE_DEFINITIONS[role]
  const menuGroups = ROLE_MENUS[role] ?? []

  // Other available roles for this user
  const otherRoles = roles.filter((r) => r !== role)

  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white text-slate-800 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6 dark:border-slate-800">
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 font-mono text-base font-bold text-white shadow-sm">
          U
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            UNILAKE<span className="text-sky-600 dark:text-sky-400">_AI</span>
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
            Enterprise Data Lake
          </span>
        </div>
      </div>

      {/* Role Workspace Badge */}
      <div className="border-b border-slate-100 bg-slate-50/75 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Không gian làm việc
          </span>
          <span className="rounded bg-sky-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
            {role}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
          {roleDef.name}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{roleDef.description}</p>

        {/* Role switcher if user has multiple roles */}
        {otherRoles.length > 0 && (
          <div className="mt-3 border-t border-slate-200/60 pt-2 dark:border-slate-800/60">
            <span className="text-[10px] font-medium text-slate-400">
              Chuyển sang vai trò khác:
            </span>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {otherRoles.map((otherRole) => {
                const targetDef = ROLE_DEFINITIONS[otherRole]
                const targetPath = ROLE_ROUTE_PREFIXES[otherRole]
                return (
                  <Link
                    key={otherRole}
                    href={targetPath}
                    className="inline-flex items-center rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 transition-colors hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300"
                    title={`Chuyển sang ${targetDef.name}`}
                  >
                    {otherRole}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-6 overflow-y-auto p-4" aria-label="Sidebar Navigation">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.groupTitle ?? groupIdx}>
            {group.groupTitle && (
              <h3 className="px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.groupTitle}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] ?? LayoutDashboard
                const isActive =
                  pathname === item.href ||
                  (item.href !== roleDef.homePath && pathname.startsWith(`${item.href}/`))

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className={`size-4 transition-colors ${
                            isActive
                              ? 'text-sky-600 dark:text-sky-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {user?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                {user?.fullName ?? user?.username ?? 'Người dùng'}
              </span>
              <span className="truncate text-[10px] text-slate-400">
                {user?.email ?? user?.username ?? 'Chưa đăng nhập'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            disabled={isLoggingOut}
            aria-label="Đăng xuất"
            title="Đăng xuất"
            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
