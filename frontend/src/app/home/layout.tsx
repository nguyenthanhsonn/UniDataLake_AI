import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'

export default function HomeLayout({ children }: { children: ReactNode }) {
  return <AppShell role="USER">{children}</AppShell>
}
