'use client'

import type { ComponentType } from 'react'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileBarChart,
  FileCheck2,
  FileText,
  FolderSearch,
  GitBranch,
  GraduationCap,
  HardDrive,
  History,
  Home,
  KeyRound,
  Layers,
  LayoutDashboard,
  ScrollText,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Table,
  Upload,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react'

import { ROLE_MENUS } from '@/config/menu'
import { ROLE_DEFINITIONS } from '@/config/roles'
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
  ScrollText,
  Sparkles,
  Upload,
  Workflow,
  ClipboardCheck,
  FolderSearch,
  FileCheck2,
}

interface SidebarProps {
  role: RoleCode
  onCloseMobile?: () => void
}

export function Sidebar({ role, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const roleDef = ROLE_DEFINITIONS[role]
  const menuGroups = ROLE_MENUS[role] ?? []
  // Mục đang mở là mục có đường dẫn dài nhất khớp với URL (vd. /data/sources/new → Nguồn dữ liệu).
  const activeHref = menuGroups
    .flatMap((group) => group.items.map((item) => item.href))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0]

  return (
    <aside className="glass-panel-strong flex h-full w-[17rem] flex-col rounded-[2rem] p-3 text-slate-600">
      <div className={`pb-5 pl-2 pt-2 ${onCloseMobile ? 'pr-12' : 'pr-2'}`}>
        <div className="flex items-center gap-3">
          <Image
            src="/assets/ui/unilake-glass-orb.png"
            alt=""
            width={48}
            height={48}
            priority
            className="size-12 object-contain drop-shadow-[0_10px_18px_rgba(99,102,241,0.2)]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-extrabold tracking-[-0.02em] text-slate-950">
                UniLake AI
              </p>
              <span className="rounded-full border border-white/80 bg-white/70 px-1.5 py-0.5 text-[8px] font-bold text-indigo-600">
                V2
              </span>
            </div>
            <p className="truncate text-[10px] font-medium text-slate-500">
              {roleDef.workspaceLabel}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/80 bg-white/45 px-3 py-2.5 shadow-sm">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Không gian vai trò
          </p>
          <p className="mt-1 truncate text-xs font-bold text-slate-800">{roleDef.name}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-1" aria-label="Điều hướng chính">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.groupTitle ?? groupIdx}>
            {group.groupTitle && (
              <h3 className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.groupTitle}
              </h3>
            )}
            <ul className="space-y-1.5">
              {group.items.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] ?? LayoutDashboard
                const isActive = item.href === activeHref

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onCloseMobile}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex min-h-10 items-center gap-2.5 rounded-2xl px-3 text-[12px] transition-all ${
                        isActive
                          ? 'border border-white/90 bg-white/85 font-bold text-slate-950 shadow-[0_8px_24px_rgba(82,89,130,0.12)]'
                          : 'font-semibold text-slate-500 hover:bg-white/50 hover:text-slate-900'
                      }`}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 group-hover:bg-white/60 group-hover:text-indigo-500'}`}
                      >
                        <IconComponent className="size-3.5" />
                      </span>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-px font-mono text-[9px] font-bold uppercase ${
                            isActive ? 'bg-slate-950 text-white' : 'bg-indigo-100 text-indigo-600'
                          }`}
                        >
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

      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/80 bg-gradient-to-br from-slate-950 to-slate-800 p-3.5 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-2.5">
          <Image
            src="/assets/ui/ai-spark-sticker.png"
            alt=""
            width={40}
            height={40}
            className="size-10 object-contain"
          />
          <div>
            <p className="text-[11px] font-bold">UniLake Copilot</p>
            <p className="text-[9px] text-slate-300">AI theo ngữ cảnh dữ liệu</p>
          </div>
        </div>
        <p className="mt-2.5 text-[10px] leading-4 text-slate-300">
          Bronze → Silver → Gold, luôn truy vết được nguồn dữ liệu.
        </p>
      </div>
    </aside>
  )
}
