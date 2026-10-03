'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

import styles from '../styles/login.module.css'

const dataLayers = [
  { label: 'Bronze', tone: 'bronze', icon: '01' },
  { label: 'Silver', tone: 'silver', icon: '02' },
  { label: 'Gold', tone: 'gold', icon: '03' },
]

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasError(true)
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
            <span>Bảo mật theo chuẩn ISO 27001</span>
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
            <p>Dùng tài khoản của trường để truy cập hệ thống.</p>
          </header>
          {hasError && (
            <div className={styles.errorBanner} role="alert">
              <span className={styles.alertIcon} aria-hidden="true">
                !
              </span>
              <p>
                <strong>Sai thông tin đăng nhập.</strong> Email hoặc mật khẩu không đúng. Còn 2 lần
                thử.
              </p>
              <button
                type="button"
                aria-label="Đóng thông báo lỗi"
                onClick={() => setHasError(false)}
              >
                ×
              </button>
            </div>
          )}
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
          <form
            className={`${styles.loginForm} ${hasError ? styles.hasError : ''}`}
            onSubmit={handleSubmit}
          >
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tenban@university.edu.vn"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setHasError(false)
              }}
              autoComplete="email"
              required
            />
            <div className={styles.passwordLabelRow}>
              <label htmlFor="password">Mật khẩu</label>
              {hasError && <span className={styles.fieldError}>Không đúng mật khẩu</span>}
            </div>
            <div className={styles.passwordField}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setHasError(false)
                }}
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            {hasError && (
              <p className={styles.passwordHint}>
                Kiểm tra lại mật khẩu hoặc dùng Forgot password.
              </p>
            )}
            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input type="checkbox" /> <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#forgot-password">Quên mật khẩu?</a>
            </div>
            <button className={styles.submitButton} type="submit">
              Đăng nhập <span aria-hidden="true">→</span>
            </button>
          </form>
          <p className={styles.accessNote}>
            Truy cập được cấp theo role. Liên hệ Quản trị Hệ thống nếu bị từ chối.
          </p>
        </div>
      </section>
    </main>
  )
}
