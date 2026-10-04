import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import '@testing-library/jest-dom/vitest'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  test: { environment: 'jsdom', setupFiles: ['./vitest.setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
})
