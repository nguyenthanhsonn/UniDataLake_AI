'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import { useRouter } from 'next/navigation'

import { getDefaultHomeForRoles } from '@/config/roles'
import styles from '@/styles/login.module.css'
import type { RoleCode } from '@/types/auth'

const dataLayers = [
  { label: 'Bronze', tone: 'bronze', icon: '01' },
  { label: 'Silver', tone: 'silver', icon: '02' },
  { label: 'Gold', tone: 'gold', icon: '03' },
]

export function LoginView() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void (async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const errorData = (await res.json().catch(() => ({}))) as {
            detail?: string
            message?: string
          }
          setErrorMessage(
            errorData.detail ??
              errorData.message ??
              'Sai thông tin đăng nhập. Vui lòng kiểm tra lại username và mật khẩu.'
          )
          setIsLoading(false)
          return
        }

        // Check current user role via /api/auth/me
        const meRes = await fetch('/api/auth/me')
        if (meRes.ok) {
          const meData = (await meRes.json()) as { user?: { roles?: RoleCode[] } }
          const roles = meData.user?.roles ?? []
          const destination = getDefaultHomeForRoles(roles)
          router.push(destination)
        } else {
          router.push('/home')
        }
        router.refresh()
      } catch {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.')
        setIsLoading(false)
      }
    })()
  }

  return (
    <main className={`${styles.loginShell} ${darkMode ? styles.isDark : ''}`}>
      <section className={styles.brandPanel} aria-label="Giới thiệu UniLake AI">
        <div className={styles.brandGrid} aria-hidden="true" />
        <div className={styles.brandContent}>
          <div className={styles.brandMarkRow}>
            <div className={styles.brandMark}>U</div>
            <span className={styles.brandName}>
              UNILAKE<span>_AI</span>
            </span>
          </div>
          <p className={styles.eyebrow}>Data lake đa nguồn</p>
          <div className={styles.brandCopy}>
            <h1>Dữ liệu quản trị đại học, hỏi bằng ngôn ngữ tự nhiên.</h1>
            <div className={styles.modulePills} aria-label="Các phân hệ dữ liệu">
              <span>Tuyển sinh</span>
              <span>Đào tạo</span>
              <span>Nhân sự</span>
            </div>
          </div>
          <div className={styles.pipeline} aria-label="Luồng xử lý dữ liệu">
            <div className={styles.pipelineLine} />
            <span className={styles.pipelineSource}>Nguồn</span>
            {dataLayers.map((layer) => (
              <div className={`${styles.pipelineStep} ${styles[layer.tone]}`} key={layer.label}>
                <span className={styles.stepIcon}>{layer.icon}</span>
                <span>{layer.label}</span>
              </div>
            ))}
          </div>
          <div className={styles.trustNote}>
            <span className={styles.lockIcon} aria-hidden="true">
              ⌑
            </span>
            <span>Bảo mật theo chuẩn ISO 27001 & RBAC 6 nhóm quyền</span>
          </div>
        </div>
        <p className={styles.version}>
          Phiên bản 1.0 <span>·</span> Tháng 9, 2026
        </p>
      </section>

      <section className={styles.formPanel}>
        <button
          className={styles.themeToggle}
          type="button"
          aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
          onClick={() => setDarkMode((current) => !current)}
        >
          <span aria-hidden="true">{darkMode ? '☼' : '◐'}</span>
          <span>{darkMode ? 'Sáng' : 'Tối'}</span>
        </button>
        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}>
            UNILAKE<span>_AI</span>
          </div>
          <header className={styles.formHeader}>
            <p className={styles.formKicker}>Cổng truy cập</p>
            <h2>Đăng nhập</h2>
            <p>Dùng tài khoản username của trường để truy cập hệ thống.</p>
          </header>
          {errorMessage && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.alertIcon} aria-hidden="true">
                !
              </span>
              <p>
                <strong>Lỗi đăng nhập:</strong> {errorMessage}
              </p>
              <button
                type="button"
                aria-label="Đóng thông báo lỗi"
                onClick={() => setErrorMessage(null)}
              >
                ×
              </button>
            </div>
          )}
          {/* Tạm ẩn đăng nhập SSO và dải phân cách (không xóa) */}
          {/*
          <button className={styles.ssoButton} type="button">
            <span className={styles.ssoLogo} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            Đăng nhập bằng tài khoản trường (SSO)
            <span className={styles.buttonArrow} aria-hidden="true">
              →
            </span>
          </button>
          <div className={styles.divider}>
            <span>hoặc dùng tài khoản riêng</span>
          </div>
          */}
          <form
            className={`${styles.loginForm} ${errorMessage ? styles.hasError : ''}`}
            onSubmit={handleSubmit}
          >
            <label htmlFor="username">Tên đăng nhập (Username)</label>
            <input
              id="username"
              type="text"
              placeholder="Nhập username của bạn"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setErrorMessage(null)
              }}
              autoComplete="username"
              required
            />
            <div className={styles.passwordLabelRow}>
              <label htmlFor="password">Mật khẩu</label>
              {errorMessage && <span className={styles.fieldError}>Kiểm tra mật khẩu</span>}
            </div>
            <div className={styles.passwordField}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErrorMessage(null)
                }}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input type="checkbox" /> <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#forgot-password">Quên mật khẩu?</a>
            </div>
            <button className={styles.submitButton} type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'} <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className={styles.accessNote}>
            Hệ thống phân quyền theo role_code (SUPER_ADMIN, DATA_ENGINEER, DATA_GOVERNANCE,
            DATA_ANALYST, ACADEMIC_ADMIN, USER).
          </p>
        </div>
      </section>
    </main>
  )
}
