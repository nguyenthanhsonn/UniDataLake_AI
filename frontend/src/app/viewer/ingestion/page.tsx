import { IngestionView } from '@/views/data/ingestion-view'

export const metadata = { title: 'Job nạp dữ liệu | UniLake AI' }

export default function ViewerIngestionPage() {
  return <IngestionView canCreate={false} workspaceLabel="Điều hành" />
}
