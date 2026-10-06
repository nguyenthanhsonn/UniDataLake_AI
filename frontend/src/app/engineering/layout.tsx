import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'

export default function EngineeringLayout({ children }: { children: ReactNode }) {
  return <AppShell role="DATA_ENGINEER">{children}</AppShell>
}
