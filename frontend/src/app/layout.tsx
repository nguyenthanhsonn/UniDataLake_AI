import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'

import '../styles/globals.css'
import { Providers } from './providers'

import type { Metadata } from 'next'

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
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
