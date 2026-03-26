import Link from 'next/link'
import { Pill } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function SearchLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // 로그인된 경우 앱 레이아웃과 동일한 사이드바 제공 (동적 import)
    const AppLayout = (await import('@/app/dashboard/layout')).default
    return <AppLayout>{children}</AppLayout>
  }

  // 비회원: 간단한 헤더만
  return (
    <div className="min-h-screen bg-sage-50">
      <header className="bg-white border-b border-sage-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-mint-500 rounded-xl flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sage-900">약속</span>
          </Link>
          <Link href="/auth/login" className="btn-primary text-sm">로그인</Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
