import { beforeEach, describe, expect, it, vi } from 'vitest'

import { API_ListSessions, API_RevokeSession } from './api_sessions'

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('@/api/http', () => ({
  http: {
    get: mockGet,
    post: mockPost,
  },
}))

describe('session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the authenticated user sessions', async () => {
    const sessions = [
      {
        login_session_id: 42,
        login_at: '2026-11-05T08:00:00',
        ip_address: null,
        user_agent: null,
        session_status: 'ACTIVE',
      },
    ]
    mockGet.mockResolvedValue({ data: sessions })

    await expect(API_ListSessions()).resolves.toEqual(sessions)
    expect(mockGet).toHaveBeenCalledWith('/auth/sessions')
  })

  it('revokes a session by its backend id', async () => {
    mockPost.mockResolvedValue({ data: { message: 'ok' } })

    await expect(API_RevokeSession(42)).resolves.toBeUndefined()
    expect(mockPost).toHaveBeenCalledWith('/auth/revoke-session/42')
  })
})
