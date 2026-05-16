import Link from 'next/link'
import { Pill, Camera, CalendarDays, ShieldAlert, Bot, ArrowRight, Check } from 'lucide-react'
import { AnimatedSection } from '@/components/ui/AnimatedSection'

const STEPS = [
  {
    num: '01',
    icon: Camera,
    color: 'bg-mint-500',
    shadow: 'shadow-mint-500/25',
    title: '약 사진 촬영',
    desc: '약 봉투나 알약을 사진으로 찍어 업로드하면 AI가 의약품을 자동으로 인식합니다.',
  },
  {
    num: '02',
    icon: CalendarDays,
    color: 'bg-sage-700',
    shadow: 'shadow-sage-700/20',
    title: '복약 일정 등록',
    desc: '인식된 약을 바탕으로 아침·점심·저녁·취침 시간대에 복약 일정을 간편하게 등록하세요.',
  },
  {
    num: '03',
    icon: Check,
    color: 'bg-mint-600',
    shadow: 'shadow-mint-600/25',
    title: '매일 복약 체크',
    desc: '알림을 받고 복용 여부를 체크하며 건강한 복약 습관을 만들어가세요.',
  },
]

const VALUES = [
  {
    num: '01',
    icon: CalendarDays,
    title: '복약 습관 관리',
    desc: '규칙적인 복약은 치료 효과를 높이는 핵심입니다. 약속은 매일의 복약을 습관으로 만들어드립니다. 놓친 복약도 기록되어 의사와의 상담에 활용할 수 있습니다.',
    tag: '습관 형성',
  },
  {
    num: '02',
    icon: ShieldAlert,
    title: '안전한 약 복용',
    desc: '복용 중인 약물의 상호작용을 자동으로 감지하여 위험한 조합을 미리 경고합니다. 근거 기반 데이터로 안심하고 복용할 수 있는 환경을 만들어드립니다.',
    tag: '안전 보장',
  },
  {
    num: '03',
    icon: Camera,
    title: 'AI 기반 약품 인식',
    desc: '최신 AI 기술로 약 사진 한 장에서 의약품을 즉시 식별합니다. 복잡한 약 이름을 외우거나 검색할 필요 없이 카메라 하나로 모든 정보를 확인하세요.',
    tag: 'AI 기술',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7fdf9] overflow-x-hidden">
      {/* 배경 블러 오브 */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[700px] h-[700px] bg-mint-200/25 rounded-full blur-[140px]" />
        <div className="absolute bottom-[5%] left-[-15%] w-[600px] h-[600px] bg-sage-200/20 rounded-full blur-[120px]" />
        <div className="absolute top-[50%] left-[40%] w-[400px] h-[400px] bg-mint-100/20 rounded-full blur-[100px]" />
      </div>

      {/* 헤더 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 border-b border-sage-100/60">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-mint-400 to-mint-600 rounded-xl flex items-center justify-center shadow-sm shadow-mint-500/30">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-sage-900 tracking-tight">약속</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-sage-500">
            <Link href="/search" className="hover:text-mint-600 transition-colors duration-150">의약품 검색</Link>
            <Link href="/auth/signup" className="hover:text-mint-600 transition-colors duration-150">복약 관리</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-sage-600 px-4 py-2 rounded-xl hover:bg-sage-100 transition-colors duration-150"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-semibold bg-mint-500 hover:bg-mint-600 text-white px-4 py-2 rounded-xl transition-colors duration-150 shadow-sm shadow-mint-500/25"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* 히어로 */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-mint-500/10 text-mint-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-8 border border-mint-300/40">
            <span className="w-1.5 h-1.5 bg-mint-500 rounded-full animate-pulse" />
            AI 기반 스마트 복약 관리
          </div>

          <h1 className="text-6xl font-bold text-sage-900 leading-[1.08] tracking-tight mb-6">
            약 관리,<br />
            이제{' '}
            <span className="bg-gradient-to-r from-mint-500 to-mint-700 bg-clip-text text-transparent">
              스마트하게
            </span>
          </h1>

          <p className="text-xl text-sage-400 mb-10 leading-relaxed max-w-lg">
            사진 한 장으로 약을 인식하고, 복약 일정부터
            약물 상호작용까지 한 곳에서 관리하세요.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold px-6 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/25 hover:shadow-mint-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Camera className="w-5 h-5" />
              약 사진으로 검색
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-sage-50 text-sage-700 font-semibold px-6 py-3.5 rounded-2xl border border-sage-200 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
            >
              무료로 시작하기
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {['복약 알림 100% 무료', '약물 상호작용 자동 감지', 'AI 챗봇 24/7'].map((text) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-sage-400">
                <div className="w-4 h-4 rounded-full bg-mint-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 text-mint-600" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* 우측 미리보기 카드 (데스크탑) */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 w-72">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl shadow-sage-200/40 border border-sage-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-mint-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Pill className="w-4 h-4 text-mint-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-sage-400">오늘 복약</p>
                <p className="text-sm font-semibold text-sage-800 truncate">타이레놀 500mg</p>
              </div>
              <span className="text-xs bg-mint-50 text-mint-700 px-2 py-0.5 rounded-full font-semibold border border-mint-100 flex-shrink-0">완료</span>
            </div>
            <div className="h-1.5 bg-sage-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-mint-400 to-mint-500 rounded-full" />
            </div>
            <p className="text-xs text-sage-400 mt-1.5">오늘 3/4 복용 완료</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl shadow-sage-200/40 border border-sage-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm font-semibold text-sage-800">상호작용 주의</span>
            </div>
            <p className="text-xs text-sage-500 leading-relaxed">
              아스피린 + 이부프로펜 조합은 위장 출혈 위험이 있습니다.
            </p>
          </div>

          <div className="bg-gradient-to-br from-mint-50 to-sage-50 rounded-2xl p-4 border border-mint-100">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-mint-600" />
              <span className="text-xs font-semibold text-mint-700">AI 챗봇</span>
            </div>
            <p className="text-xs text-sage-500 leading-relaxed">"타이레놀과 함께 복용하면 안 되는 약이 있나요?"</p>
            <div className="mt-2 text-xs text-mint-600 font-medium">답변 작성 중...</div>
          </div>
        </div>
      </section>

      {/* ── 서비스 소개 애니메이션: 3단계 ── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <AnimatedSection className="text-center mb-16">
          <p className="text-xs font-bold text-mint-600 tracking-[0.2em] uppercase mb-3">How it works</p>
          <h2 className="text-4xl font-bold text-sage-900 tracking-tight mb-3">3단계로 시작하세요</h2>
          <p className="text-sage-400 text-lg">복잡한 약 관리, 이제 누구나 쉽게</p>
        </AnimatedSection>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          {/* 연결 선 (데스크탑) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-10 left-[calc(33.333%_-_0.5rem)] right-[calc(33.333%_-_0.5rem)] h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #86efC4 20%, #86efC4 80%, transparent)' }}
          />

          {STEPS.map(({ num, icon: Icon, color, shadow, title, desc }, i) => (
            <AnimatedSection key={num} delay={i * 160}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className={`w-20 h-20 ${color} rounded-3xl flex items-center justify-center shadow-lg ${shadow}`}>
                    <Icon className="w-9 h-9 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border-2 border-sage-100 shadow-sm text-xs font-bold text-sage-500 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <p className="text-[11px] font-bold tracking-[0.15em] text-mint-500 uppercase mb-2">STEP {num}</p>
                <h3 className="text-xl font-bold text-sage-900 mb-3">{title}</h3>
                <p className="text-sage-400 text-sm leading-relaxed max-w-xs">{desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── 핵심 가치 매니페스토 ── */}
      <section className="bg-sage-900 py-24 mb-20">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection className="mb-14">
            <p className="text-xs font-bold text-mint-400 tracking-[0.2em] uppercase mb-4">Our Core Values</p>
            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight max-w-lg">
              약속이 제공하는<br />세 가지 핵심 가치
            </h2>
          </AnimatedSection>

          <div className="divide-y divide-sage-700/60">
            {VALUES.map(({ num, icon: Icon, title, desc, tag }, i) => (
              <AnimatedSection key={num} delay={i * 120}>
                <div className="py-10 flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                  {/* 번호 */}
                  <span className="text-5xl font-black text-sage-700 leading-none w-16 flex-shrink-0 select-none">
                    {num}
                  </span>

                  {/* 텍스트 */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-2xl md:text-3xl font-bold text-white">{title}</h3>
                      <span className="text-xs font-semibold text-mint-400 border border-mint-700 px-2.5 py-0.5 rounded-full">
                        {tag}
                      </span>
                    </div>
                    <p className="text-sage-400 leading-relaxed max-w-2xl">{desc}</p>
                  </div>

                  {/* 아이콘 */}
                  <div className="hidden md:flex w-12 h-12 bg-sage-800 rounded-2xl items-center justify-center flex-shrink-0 mt-1">
                    <Icon className="w-5 h-5 text-mint-400" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* CTA */}
          <AnimatedSection delay={360} className="pt-14">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold px-7 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/30 hover:-translate-y-0.5"
            >
              지금 무료로 시작하기
              <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* 벤토 기능 그리드 */}
      <section className="relative max-w-6xl mx-auto px-6 pb-28">
        <AnimatedSection className="text-center mb-14">
          <h2 className="text-4xl font-bold text-sage-900 tracking-tight mb-3">복약 관리의 모든 것</h2>
          <p className="text-sage-400 text-lg">필요한 모든 기능을 하나의 서비스에서</p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 메인 피처 — AI 이미지 검색 (2열) */}
          <Link
            href="/search"
            className="group lg:col-span-2 bg-gradient-to-br from-mint-500 via-mint-600 to-mint-700 rounded-3xl p-8 text-white hover:shadow-2xl hover:shadow-mint-500/30 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI 이미지 검색</h3>
            <p className="text-mint-100 leading-relaxed mb-8 max-w-sm">
              약 사진을 업로드하면 AI가 자동으로 의약품을 인식하고 상세 정보를 제공합니다. 복잡한 약 이름을 외울 필요가 없어요.
            </p>
            <div className="inline-flex items-center gap-2 text-sm font-semibold bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-colors">
              지금 검색해보기
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </Link>

          {/* 복약 일정 */}
          <Link
            href="/auth/signup"
            className="group bg-white rounded-3xl p-8 border border-sage-100 hover:shadow-xl hover:shadow-sage-200/50 hover:border-mint-200 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="w-12 h-12 bg-mint-50 rounded-2xl flex items-center justify-center mb-6">
              <CalendarDays className="w-6 h-6 text-mint-600" />
            </div>
            <h3 className="text-xl font-bold text-sage-900 mb-3">복약 일정 관리</h3>
            <p className="text-sage-400 text-sm leading-relaxed mb-4">
              아침·점심·저녁·취침 시간대별로 복약 일정을 등록하고 매일 체크하세요.
            </p>
            <span className="text-xs font-semibold text-mint-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              시작하기 <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {/* 약물 상호작용 */}
          <Link
            href="/auth/signup"
            className="group bg-white rounded-3xl p-8 border border-sage-100 hover:shadow-xl hover:shadow-sage-200/50 hover:border-mint-200 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-sage-900 mb-3">약물 상호작용 감지</h3>
            <p className="text-sage-400 text-sm leading-relaxed mb-4">
              복용 중인 약의 위험한 조합을 자동 감지하여 안전한 복약을 도와드립니다.
            </p>
            <span className="text-xs font-semibold text-mint-600 flex items-center gap-1 group-hover:gap-2 transition-all">
              확인하기 <ArrowRight className="w-3 h-3" />
            </span>
          </Link>

          {/* AI 챗봇 (2열) */}
          <Link
            href="/auth/signup"
            className="group lg:col-span-2 bg-sage-900 rounded-3xl p-8 text-white hover:shadow-2xl hover:shadow-sage-900/40 transition-all duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI 상담 챗봇</h3>
            <p className="text-sage-300 leading-relaxed max-w-md">
              약에 관한 궁금한 점을 언제든지 물어보세요. 24시간 전문적인 한국어 답변을 제공합니다.
            </p>
          </Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-sage-100/80 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-sage-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-mint-400 to-mint-600 rounded-lg flex items-center justify-center">
              <Pill className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sage-600">약속</span>
          </div>
          <p>© 2026 약속 · 본 서비스는 참고용이며 의료 진단을 대체하지 않습니다</p>
        </div>
      </footer>
    </main>
  )
}
