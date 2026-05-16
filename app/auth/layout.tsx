import Link from 'next/link'
import { Pill, Camera, CalendarDays, ShieldAlert } from 'lucide-react'

const FEATURES = [
  { icon: Camera,      text: 'AI가 약 사진을 자동으로 인식합니다' },
  { icon: CalendarDays, text: '복약 일정과 알림을 한 곳에서 관리하세요' },
  { icon: ShieldAlert, text: '약물 상호작용을 자동으로 감지합니다' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7fdf9] flex">

      {/* ── 좌측 브랜딩 패널 (데스크탑) ── */}
      <div className="hidden lg:flex lg:w-[460px] xl:w-[500px] flex-shrink-0 bg-sage-900 flex-col relative overflow-hidden">
        {/* 배경 오브 */}
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-mint-500/10 rounded-full blur-[90px]" />
        <div className="absolute bottom-[10%] left-[-15%] w-72 h-72 bg-sage-700/60 rounded-full blur-[70px]" />

        {/* 로고 */}
        <div className="relative z-10 p-10">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-mint-400 to-mint-600 rounded-xl flex items-center justify-center shadow-sm shadow-mint-500/30">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight group-hover:text-mint-200 transition-colors">약속</span>
          </Link>
        </div>

        {/* 카피 + 기능 목록 */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-10">
          <p className="text-xs font-bold text-mint-400 tracking-[0.2em] uppercase mb-4">Smart Medication</p>
          <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-4">
            건강한 복약 습관의<br />시작
          </h2>
          <p className="text-sage-400 mb-10 leading-relaxed">
            AI가 도와주는 스마트한 복약 관리로<br />더 건강한 하루를 만들어가세요.
          </p>

          <div className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mint-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-mint-400" />
                </div>
                <span className="text-sage-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* 미니 데모 카드 */}
          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-mint-500/25 rounded-lg flex items-center justify-center flex-shrink-0">
                <Pill className="w-4 h-4 text-mint-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sage-500">오늘의 복약</p>
                <p className="text-sm font-semibold text-white truncate">타이레놀 500mg</p>
              </div>
              <span className="text-xs bg-mint-500/20 text-mint-400 px-2 py-0.5 rounded-full flex-shrink-0">완료</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-mint-500 to-mint-400 rounded-full" />
            </div>
            <p className="text-xs text-sage-500 mt-1.5">오늘 3/4 복용 완료</p>
          </div>
        </div>
      </div>

      {/* ── 우측 폼 영역 ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* 배경 오브 */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-mint-200/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] bg-sage-200/15 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* 모바일 로고 */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-mint-400 to-mint-600 rounded-xl flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-sage-900">약속</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
