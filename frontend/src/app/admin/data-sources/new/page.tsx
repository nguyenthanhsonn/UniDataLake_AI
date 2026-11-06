import { SourceFormView } from '@/views/data/source-form-view'

export const metadata = { title: 'Thêm nguồn dữ liệu | UniLake AI' }

export default function AdminSourceFormPage() {
  return <SourceFormView returnPath="/admin/data-sources" workspaceLabel="Quản trị hệ thống" />
}
