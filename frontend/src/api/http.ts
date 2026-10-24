import axios from 'axios'
import Cookies from 'js-cookie'

import { API } from '@/api/api'
import { redirectToLoginExpired } from '@/lib/session'
import type { ApiErrorBody } from '@/types/auth'

/** Client gọi REST API của backend (`/api/v1`), tự gắn Bearer token đã lưu khi đăng nhập. */
export const http = axios.create({ baseURL: `${API}/api/v1`, timeout: 30_000 })

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

// Token hết hạn hoặc bị thu hồi: backend trả 401 cho request đã gửi kèm token.
http.interceptors.response.use(undefined, (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    error.config?.headers.has('Authorization')
  ) {
    redirectToLoginExpired()
  }
  return Promise.reject(error instanceof Error ? error : new Error(String(error)))
})

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  429: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.',
}

const SERVER_ERROR_MESSAGE = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'

/**
 * Lấy thông báo lỗi dễ đọc. Ưu tiên nội dung backend trả trong envelope lỗi chuẩn;
 * lỗi máy chủ (5xx) luôn dùng câu chung để không lộ chi tiết kỹ thuật.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return fallback
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau.'
  }
  if (!error.response) {
    return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
  }
  const { status } = error.response
  if (status >= 500) {
    return SERVER_ERROR_MESSAGE
  }
  const body = error.response.data as ApiErrorBody | undefined
  const detail = typeof body?.detail === 'string' ? body.detail : undefined
  return body?.error?.message ?? detail ?? body?.message ?? STATUS_MESSAGES[status] ?? fallback
}

/** Mã request_id backend gắn vào lỗi, dùng để tra log khi báo sự cố. */
export function getApiRequestId(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined
  }
  const body = error.response?.data as { error?: { request_id?: unknown } } | undefined
  const fromBody = body?.error?.request_id
  if (typeof fromBody === 'string' && fromBody) {
    return fromBody
  }
  const fromHeader: unknown = error.response?.headers?.['x-request-id']
  return typeof fromHeader === 'string' && fromHeader ? fromHeader : undefined
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
