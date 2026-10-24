import { AxiosError, AxiosHeaders } from 'axios'
import Cookies from 'js-cookie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { redirectToLoginExpired } from '@/lib/session'

import { getApiErrorMessage, getApiRequestId, http } from './http'

import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'

vi.mock('@/lib/session', () => ({ redirectToLoginExpired: vi.fn() }))

function errorWith(status: number, data: unknown, headers: Record<string, string> = {}) {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
  return new AxiosError('fail', 'ERR_BAD_RESPONSE', config, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(headers),
    config,
    data,
  })
}

describe('getApiErrorMessage', () => {
  it('ưu tiên thông báo backend trả về', () => {
    const error = errorWith(422, { error: { code: 'X', message: 'Tên nguồn đã tồn tại' } })
    expect(getApiErrorMessage(error, 'mặc định')).toBe('Tên nguồn đã tồn tại')
    expect(getApiErrorMessage(errorWith(400, { detail: 'Sai dữ liệu' }), 'mặc định')).toBe(
      'Sai dữ liệu'
    )
  })

  it('dùng câu theo mã lỗi khi backend không gửi nội dung', () => {
    expect(getApiErrorMessage(errorWith(403, {}), 'x')).toBe(
      'Bạn không có quyền thực hiện thao tác này.'
    )
    expect(getApiErrorMessage(errorWith(404, {}), 'x')).toBe('Không tìm thấy dữ liệu yêu cầu.')
    expect(getApiErrorMessage(errorWith(401, {}), 'x')).toMatch(/hết hạn/)
    expect(getApiErrorMessage(errorWith(418, {}), 'mặc định')).toBe('mặc định')
  })

  it('không hiện chi tiết kỹ thuật của lỗi máy chủ', () => {
    const error = errorWith(500, { error: { message: 'Traceback (most recent call last) ...' } })
    expect(getApiErrorMessage(error, 'x')).toBe('Máy chủ đang gặp sự cố. Vui lòng thử lại sau.')
  })

  it('báo mất kết nối và quá thời gian chờ', () => {
    expect(getApiErrorMessage(new AxiosError('net', 'ERR_NETWORK'), 'x')).toMatch(
      /Không thể kết nối/
    )
    expect(getApiErrorMessage(new AxiosError('slow', 'ECONNABORTED'), 'x')).toMatch(/quá lâu/)
    expect(getApiErrorMessage(new Error('khác'), 'mặc định')).toBe('mặc định')
  })
})

describe('getApiRequestId', () => {
  it('lấy request_id từ envelope lỗi hoặc header', () => {
    expect(getApiRequestId(errorWith(500, { error: { request_id: 'req_01' } }))).toBe('req_01')
    expect(getApiRequestId(errorWith(500, {}, { 'x-request-id': 'req_02' }))).toBe('req_02')
    expect(getApiRequestId(errorWith(500, {}))).toBeUndefined()
    expect(getApiRequestId(new Error('x'))).toBeUndefined()
  })
})

describe('http interceptors', () => {
  const originalAdapter = http.defaults.adapter

  function respondWith(status: number): AxiosAdapter {
    return (config) =>
      status < 400
        ? Promise.resolve({ data: {}, status, statusText: '', headers: {}, config })
        : Promise.reject(
            new AxiosError('fail', 'ERR_BAD_REQUEST', config, undefined, {
              data: {},
              status,
              statusText: '',
              headers: new AxiosHeaders(),
              config,
            })
          )
  }

  beforeEach(() => {
    vi.mocked(redirectToLoginExpired).mockReset()
    Cookies.remove('access_token')
    localStorage.clear()
  })

  afterEach(() => {
    http.defaults.adapter = originalAdapter
  })

  it('gắn Bearer token đã lưu vào request', async () => {
    Cookies.set('access_token', 'abc')
    let sent: string | undefined
    http.defaults.adapter = (config) => {
      sent = String(config.headers.get('Authorization'))
      return respondWith(200)(config)
    }
    await http.get('/datasources')
    expect(sent).toBe('Bearer abc')
  })

  it('đưa về trang đăng nhập khi request có token bị trả 401', async () => {
    Cookies.set('access_token', 'expired')
    http.defaults.adapter = respondWith(401)
    await expect(http.get('/datasources')).rejects.toBeInstanceOf(AxiosError)
    expect(redirectToLoginExpired).toHaveBeenCalledTimes(1)
  })

  it('không chuyển trang khi chưa đăng nhập hoặc lỗi khác 401', async () => {
    http.defaults.adapter = respondWith(401)
    await expect(http.get('/datasources')).rejects.toBeInstanceOf(AxiosError)

    Cookies.set('access_token', 'ok')
    http.defaults.adapter = respondWith(403)
    await expect(http.get('/datasources')).rejects.toBeInstanceOf(AxiosError)

    expect(redirectToLoginExpired).not.toHaveBeenCalled()
  })
})
