import type { ReactNode } from 'react'

import { notFound } from 'next/navigation'

import { AppShell } from '@/components/layout/app-shell'
import { getWorkspaceConfig } from '@/config/workspaces'

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ domain: string; scope: string }>
}) {
  const { domain, scope } = await params
  const config = getWorkspaceConfig(domain, scope)
  if (!config) notFound()
  return <AppShell role={config.role}>{children}</AppShell>
}
