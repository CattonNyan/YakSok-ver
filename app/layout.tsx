import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: '약속 — 스마트 복약 관리',
  description: '약, 속 시원하게 관리하다. AI 기반 복약 관리 서비스',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: 'Pretendard Variable, sans-serif' },
          }}
        />
      </body>
    </html>
  )
}
