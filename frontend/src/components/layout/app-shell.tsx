'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

import { X } from 'lucide-react'

import type { RoleCode } from '@/types/auth'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  role: RoleCode
  children: ReactNode
}

export function AppShell({ role, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <div className="hidden shrink-0 md:block">
        <Sidebar role={role} />
      </div>

      {/* Mobile Sidebar Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu nền"
          />
          <div className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-3 top-4 z-50 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              aria-label="Đóng menu"
            >
              <X className="size-4" />
            </button>
            <Sidebar role={role} onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} onOpenMobile={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
