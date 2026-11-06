import { SourcesView } from '@/views/data/sources-view'

export const metadata = { title: 'Nguồn dữ liệu | UniLake AI' }

export default function AdminSourcesPage() {
  return <SourcesView basePath="/admin/data-sources" workspaceLabel="Quản trị hệ thống" />
}
