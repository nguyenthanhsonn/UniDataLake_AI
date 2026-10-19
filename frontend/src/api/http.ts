import axios from 'axios'
import Cookies from 'js-cookie'

import { API } from '@/api/api'
import type { ApiErrorBody } from '@/types/auth'

/** Client gọi REST API của backend (`/api/v1`), tự gắn Bearer token đã lưu khi đăng nhập. */
export const http = axios.create({ baseURL: `${API}/api/v1` })

function readAccessToken(): string | undefined {
  const fromCookie = Cookies.get('access_token')
  if (fromCookie) {
    return fromCookie
  }
  try {
    return localStorage.getItem('access_token') ?? undefined
  } catch {
    return undefined
  }
}

http.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

/** Lấy thông báo lỗi dễ đọc từ envelope lỗi chuẩn của backend. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    }
    const body = error.response.data as ApiErrorBody | undefined
    const detail = typeof body?.detail === 'string' ? body.detail : undefined
    return body?.error?.message ?? detail ?? body?.message ?? fallback
  }
  return fallback
}

/** Danh sách lỗi chi tiết (vd. `details.errors` khi cấu hình nguồn dữ liệu không hợp lệ). */
export function getApiErrorDetails(error: unknown): string[] {
  if (!axios.isAxiosError(error)) {
    return []
  }
  const body = error.response?.data as
    { error?: { details?: { errors?: unknown } | null } } | undefined
  const errors = body?.error?.details?.errors
  return Array.isArray(errors)
    ? errors.filter((item): item is string => typeof item === 'string')
    : []
}
