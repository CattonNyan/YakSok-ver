'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Search, CalendarDays, Pill,
  ShieldAlert, Bot, LogOut, Menu, Loader2, UserCircle, MapPin, X
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const NAV_MAIN = [
  { href: '/dashboard',    label: '오늘의 복약',   icon: LayoutDashboard },
  { href: '/search',       label: '약 검색',       icon: Search },
  { href: '/schedule',     label: '복약 일정',     icon: Pill },
  { href: '/calendar',     label: '복약 달력',     icon: CalendarDays },
  { href: '/interaction',  label: '약물 상호작용', icon: ShieldAlert },
  { href: '/chat',         label: 'AI 상담',       icon: Bot },
  { href: '/pharmacy-map', label: '근처 약국',     icon: MapPin },
]
const NAV_BOTTOM = [
  { href: '/profile', label: '프로필', icon: UserCircle },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

function NavLink({ href, label, Icon, onClick }: {
  href: string; label: string; Icon: React.ElementType; onClick?: () => void
}) {
  const pathname = usePathname()
  const active = isActive(pathname, href)
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
        active
          ? 'bg-mint-500/15 text-mint-300'
          : 'text-sage-400 hover:bg-white/6 hover:text-sage-200'
      )}
    >
      <Icon className={clsx('w-4.5 h-4.5 shrink-0 transition-colors', active ? 'text-mint-400' : '')} aria-hidden />
      {label}
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-mint-400" />}
    </Link>
  )
}

function Sidebar({ onClose, isLoggingOut, onLogout }: {
  onClose: () => void
  isLoggingOut: boolean
  onLogout: () => void
}) {
  return (
    <aside className="flex flex-col h-full bg-sage-900 w-60 select-none">
      {/* 로고 */}
      <div className="px-5 py-5 border-b border-sage-700/50">
        <Link href="/dashboard" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 bg-gradient-to-br from-mint-400 to-mint-600 rounded-xl flex items-center justify-center shadow-sm shadow-mint-500/30">
            <Pill className="w-4 h-4 text-white" aria-hidden />
          </div>
          <span className="text-lg font-bold text-white tracking-tight group-hover:text-mint-200 transition-colors">약속</span>
        </Link>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="주요 메뉴">
        {NAV_MAIN.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} onClick={onClose} />
        ))}
      </nav>

      {/* 하단 네비게이션 */}
      <div className="px-3 pt-2 pb-2 border-t border-sage-700/50 space-y-0.5">
        {NAV_BOTTOM.map(({ href, label, icon: Icon }) => (
          <NavLink key={href} href={href} label={label} Icon={Icon} onClick={onClose} />
        ))}
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-label="로그아웃"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium transition-all duration-150',
            isLoggingOut
              ? 'text-sage-600 cursor-not-allowed'
              : 'text-sage-400 hover:bg-red-500/10 hover:text-red-400'
          )}
        >
          {isLoggingOut
            ? <Loader2 className="w-4.5 h-4.5 animate-spin" aria-hidden />
            : <LogOut className="w-4.5 h-4.5" aria-hidden />}
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
      </div>
    </aside>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      toast.success('로그아웃 되었습니다')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('로그아웃 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#f7fdf9] overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar onClose={() => {}} isLoggingOut={isLoggingOut} onLogout={handleLogout} />
      </div>

      {/* 모바일 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full z-50 shadow-2xl">
            <Sidebar
              onClose={() => setMobileOpen(false)}
              isLoggingOut={isLoggingOut}
              onLogout={handleLogout}
            />
          </div>
          {/* 닫기 버튼 */}
          <button
            className="absolute top-4 left-[calc(15rem+1rem)] z-50 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"
            onClick={() => setMobileOpen(false)}
            aria-label="메뉴 닫기"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3.5 bg-sage-900 border-b border-sage-700/50">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
            aria-expanded={mobileOpen}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-sage-300" aria-hidden />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
              <Pill className="w-3.5 h-3.5 text-white" aria-hidden />
            </div>
            <span className="font-bold text-white">약속</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
