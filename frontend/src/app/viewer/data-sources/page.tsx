import { SourcesView } from '@/views/data/sources-view'

export const metadata = { title: 'Nguồn dữ liệu | UniLake AI' }

export default function ViewerSourcesPage() {
  return <SourcesView canManage={false} workspaceLabel="Điều hành" />
}
