'use client'

import { useCallback, useEffect, useState } from 'react'

import { Laptop, LoaderCircle, RefreshCw, ShieldX } from 'lucide-react'

import { API_ListSessions, API_RevokeSession } from '@/api/api_sessions'
import { getApiErrorMessage } from '@/api/http'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { LoginSession } from '@/types/auth'

function formatLoginAt(value: string): string {
  const normalized = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN')
}

export function SessionsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [sessions, setSessions] = useState<LoginSession[]>([])
  const [loading, setLoading] = useState(false)
  const [revokingId, setRevokingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setSessions(await API_ListSessions())
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không tải được danh sách phiên đăng nhập.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [load, open])

  async function revoke(sessionId: number) {
    setRevokingId(sessionId)
    setError(null)
    try {
      await API_RevokeSession(sessionId)
      setSessions((current) => current.filter((item) => item.login_session_id !== sessionId))
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thu hồi được phiên đăng nhập.'))
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phiên đăng nhập</DialogTitle>
          <DialogDescription>
            Xem và thu hồi các phiên đang hoạt động của chính tài khoản này.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin" /> Đang tải phiên…
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/80 bg-white/45 px-4 py-8 text-center text-sm text-slate-500">
            Không có phiên hoạt động nào khác.
          </div>
        ) : (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {sessions.map((session) => (
              <div
                key={session.login_session_id}
                className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/55 p-3.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Laptop className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-slate-800">
                      Phiên #{session.login_session_id}
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      {session.session_status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-500">
                    {session.user_agent ?? 'Không có thông tin thiết bị'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {formatLoginAt(session.login_at)} · IP {session.ip_address ?? 'không xác định'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={revokingId === session.login_session_id}
                  onClick={() => void revoke(session.login_session_id)}
                >
                  <ShieldX className="size-3.5" />
                  {revokingId === session.login_session_id ? 'Đang thu hồi…' : 'Thu hồi'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="size-3.5" /> Làm mới
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
