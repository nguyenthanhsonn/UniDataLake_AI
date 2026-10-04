import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.formData()
  const res = await fetch(`${process.env.API_BASE_URL}/auth/login`, { method: 'POST', body })
  if (!res.ok) return NextResponse.json(await res.json(), { status: res.status })

  const { access_token } = (await res.json()) as { access_token: string }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('access_token', access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
