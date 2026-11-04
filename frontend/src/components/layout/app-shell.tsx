'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

import { X } from 'lucide-react'

import { ROLE_DEFINITIONS } from '@/config/roles'
import { DomainProvider } from '@/hooks/use-domain'
import type { RoleCode } from '@/types/auth'

import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  role: RoleCode
  children: ReactNode
}

export function AppShell({ role, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const roleDefinition = ROLE_DEFINITIONS[role]

  return (
    <DomainProvider lockedDomain={roleDefinition.domain}>
      <div className="app-backdrop relative min-h-screen overflow-x-hidden text-slate-900 antialiased">
        <div className="pointer-events-none fixed -left-28 top-36 size-80 rounded-full bg-rose-200/30 blur-3xl" />
        <div className="pointer-events-none fixed -right-24 -top-16 size-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none fixed -bottom-40 left-1/3 size-[30rem] rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="relative flex min-h-screen">
          {/* Desktop Sidebar */}
          <div className="sticky top-0 hidden h-screen shrink-0 p-3 pr-0 md:block">
            <Sidebar role={role} />
          </div>

          {/* Mobile Sidebar Backdrop & Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden">
              <button
                type="button"
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Đóng menu nền"
              />
              <div className="relative z-50 flex h-full max-w-[88vw] flex-col p-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="glass-control absolute right-6 top-6 z-50 flex size-9 items-center justify-center rounded-full text-slate-600 hover:text-slate-950"
                  aria-label="Đóng menu"
                >
                  <X className="size-4" />
                </button>
                <Sidebar role={role} onCloseMobile={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1 px-3 pb-3 md:px-5 md:pb-5">
            <Topbar role={role} onOpenMobile={() => setMobileMenuOpen(true)} />
            <main className="mx-auto min-w-0 max-w-[1680px] px-1 pb-6 pt-4 md:px-0 md:pt-5">
              {children}
            </main>
          </div>
        </div>
      </div>
    </DomainProvider>
  )
}
