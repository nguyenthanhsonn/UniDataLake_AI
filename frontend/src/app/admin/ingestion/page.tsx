import { IngestionView } from '@/views/data/ingestion-view'

export const metadata = { title: 'Nạp dữ liệu | UniLake AI' }

export default function AdminIngestionPage() {
  return <IngestionView workspaceLabel="Quản trị hệ thống" />
}
