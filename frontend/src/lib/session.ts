import Cookies from 'js-cookie'

/** Tham số trên URL trang đăng nhập khi phiên bị hết hạn (`/login?expired=1`). */
export const SESSION_EXPIRED_PARAM = 'expired'

/** Xoá token và thông tin người dùng đã lưu khi đăng nhập. */
export function clearStoredSession(): void {
  Cookies.remove('access_token', { path: '/' })
  Cookies.remove('refresh_token', { path: '/' })
  try {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  } catch {
    // Trình duyệt chặn lưu trữ: không có gì để xoá.
  }
}

/** Phiên hết hạn: xoá dữ liệu phiên rồi đưa người dùng về trang đăng nhập kèm thông báo. */
export function redirectToLoginExpired(): void {
  clearStoredSession()
  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return
  }
  window.location.assign(`/login?${SESSION_EXPIRED_PARAM}=1`)
}
