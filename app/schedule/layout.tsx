'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Search, CalendarDays, Pill,
  ShieldAlert, Bot, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { href: '/dashboard',    label: '오늘의 복약',   icon: LayoutDashboard },
  { href: '/search',       label: '약 검색',       icon: Search },
  { href: '/schedule',     label: '복약 일정',     icon: Pill },
  { href: '/calendar',     label: '복약 달력',     icon: CalendarDays },
  { href: '/interaction',  label: '약물 상호작용', icon: ShieldAlert },
  { href: '/chat',         label: 'AI 상담',       icon: Bot },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다')
    router.push('/')
    router.refresh()
  }

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-white border-r border-sage-100 w-60">
      <div className="px-5 py-5 border-b border-sage-100">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 bg-mint-500 rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-sage-900">약속</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            onClick={() => setMobileOpen(false)}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-mint-50 text-mint-700'
                : 'text-sage-600 hover:bg-sage-50 hover:text-sage-900'
            )}>
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sage-100">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-sage-500 hover:bg-red-50 hover:text-red-600 transition-colors">
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-sage-50 overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-sage-100">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-sage-50">
            <Menu className="w-5 h-5 text-sage-600" />
          </button>
          <span className="font-bold text-sage-900">약속</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
