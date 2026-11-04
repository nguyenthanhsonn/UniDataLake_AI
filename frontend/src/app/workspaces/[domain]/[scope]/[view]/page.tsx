import { notFound } from 'next/navigation'

import { getWorkspaceConfig } from '@/config/workspaces'
import type { WorkspaceView } from '@/config/workspaces'
import { AskAiView } from '@/views/shared/ask-ai-view'
import { QueryHistoryView } from '@/views/shared/query-history-view'
import { RoleWorkspaceView } from '@/views/workspaces/role-workspace-view'

const MANAGER_VIEWS: WorkspaceView[] = ['approvals', 'analytics']
const STAFF_VIEWS: WorkspaceView[] = ['records', 'detail']

export default async function WorkspaceSubviewPage({
  params,
}: {
  params: Promise<{ domain: string; scope: string; view: string }>
}) {
  const { domain, scope, view } = await params
  const config = getWorkspaceConfig(domain, scope)
  if (!config) notFound()

  const base = `/workspaces/${domain}/${scope}`
  if (view === 'ask') return <AskAiView historyHref={`${base}/history`} />
  if (view === 'history') return <QueryHistoryView askHref={`${base}/ask`} />

  const allowedViews = scope === 'manager' ? MANAGER_VIEWS : STAFF_VIEWS
  if (!allowedViews.includes(view as WorkspaceView)) notFound()
  return <RoleWorkspaceView config={config} view={view as WorkspaceView} />
}
