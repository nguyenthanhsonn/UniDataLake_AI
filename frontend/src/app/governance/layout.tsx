import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'

export default function GovernanceLayout({ children }: { children: ReactNode }) {
  return <AppShell role="DATA_GOVERNANCE">{children}</AppShell>
}
