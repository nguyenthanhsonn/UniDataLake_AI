import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginView } from './login-view'

const push = vi.fn()
const refresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('LoginView', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    fetchMock.mockReset()
    push.mockReset()
    refresh.mockReset()
  })

  it('shows a message under each empty field and does not call the API', async () => {
    const user = userEvent.setup()
    render(<LoginView />)

    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Vui lòng nhập tên đăng nhập hoặc email.')).toBeInTheDocument()
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email hoặc tên đăng nhập')).toHaveAttribute(
      'aria-invalid',
      'true'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed email but accepts a plain username', async () => {
    const user = userEvent.setup()
    render(<LoginView />)

    await user.type(screen.getByLabelText('Email hoặc tên đăng nhập'), 'dat.td@')
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password@123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByText('Email không đúng định dạng.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts JSON credentials and redirects to the role home on success', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(jsonResponse({ user: { roles: ['DATA_ANALYST'] } }))
    const user = userEvent.setup()
    render(<LoginView />)

    await user.type(screen.getByLabelText('Email hoặc tên đăng nhập'), 'analyst')
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password@123')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/analytics'))
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/auth/login')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body as string)).toEqual({
      username: 'analyst',
      password: 'Password@123',
    })
  })

  it('shows the backend error message when credentials are wrong', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tên đăng nhập hoặc mật khẩu chưa đúng' },
        },
        401
      )
    )
    const user = userEvent.setup()
    render(<LoginView />)

    await user.type(screen.getByLabelText('Email hoặc tên đăng nhập'), 'analyst')
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai-mat-khau')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Tên đăng nhập hoặc mật khẩu chưa đúng')
    expect(push).not.toHaveBeenCalled()
  })
})
