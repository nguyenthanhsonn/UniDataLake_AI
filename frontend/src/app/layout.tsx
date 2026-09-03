import type { ReactNode } from 'react'

import type { Metadata } from 'next'

import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'UniLake AI',
  description: 'Nền tảng Data Lake đa nguồn tích hợp AI Analytics cho quản trị đại học.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
