import { notFound } from 'next/navigation'

import { getWorkspaceConfig } from '@/config/workspaces'
import { RoleWorkspaceView } from '@/views/workspaces/role-workspace-view'

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ domain: string; scope: string }>
}) {
  const { domain, scope } = await params
  const config = getWorkspaceConfig(domain, scope)
  if (!config) notFound()
  return <RoleWorkspaceView config={config} />
}
