import { http } from '@/api/http'
import type { LoginSession } from '@/types/auth'

export async function API_ListSessions(): Promise<LoginSession[]> {
  const response = await http.get<LoginSession[]>('/auth/sessions')
  return response.data
}

export async function API_RevokeSession(sessionId: number): Promise<void> {
  await http.post(`/auth/revoke-session/${sessionId}`)
}
