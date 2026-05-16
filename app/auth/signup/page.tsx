'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'

function getKoreanAuthError(message: string): string {
  const errorMap: Record<string, string> = {
    'User already registered':        '이미 가입된 이메일 주소입니다. 로그인을 시도해 주세요.',
    'Email already in use':           '이미 사용 중인 이메일 주소입니다.',
    'Email not confirmed':            '이메일 인증이 완료되지 않았습니다. 받으신 인증 메일을 확인해 주세요.',
    'Invalid email':                  '올바른 이메일 주소 형식이 아닙니다.',
    'Password should be at least':    '비밀번호는 8자 이상이어야 합니다.',
    'Signup is disabled':             '현재 회원가입이 제한되어 있습니다. 잠시 후 다시 시도해 주세요.',
    'Unable to validate email address': '이메일 주소를 확인할 수 없습니다. 다시 입력해 주세요.',
    'Too many requests':              '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  }
  for (const [key, korean] of Object.entries(errorMap)) {
    if (message.includes(key)) return korean
  }
  return '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const level = Math.min(Math.floor(password.length / 2), 4)
  const strong = password.length >= 8
  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < level
                ? strong ? 'bg-mint-500' : 'bg-amber-400'
                : 'bg-sage-100'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium transition-colors ${strong ? 'text-mint-600' : 'text-amber-500'}`}>
        {strong ? '안전한 비밀번호입니다' : `${8 - password.length}자 더 입력하세요`}
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      toast.error(getKoreanAuthError(error.message))
    } else {
      toast.success('회원가입 완료! 이메일을 확인해 주세요')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sage-900 tracking-tight mb-2">시작해볼까요</h1>
        <p className="text-sage-400">약속과 함께 건강한 복약 습관을 만들어보세요</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1.5">이름</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="홍길동"
            required
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1.5">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
            className="input-base"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-sage-700 mb-1.5">비밀번호</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="8자 이상 입력"
              required
              minLength={8}
              className="input-base pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              {showPw ? <EyeOff className="w-5 h-5" aria-hidden /> : <Eye className="w-5 h-5" aria-hidden />}
            </button>
          </div>
          <PasswordStrength password={password} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/25 hover:shadow-mint-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <ArrowRight className="w-4 h-4" />
          }
          가입하기
        </button>
      </form>

      <p className="text-center text-xs text-sage-400 mt-4 leading-relaxed">
        가입하면{' '}
        <span className="text-sage-500 underline cursor-pointer">이용약관</span> 및{' '}
        <span className="text-sage-500 underline cursor-pointer">개인정보처리방침</span>에 동의하게 됩니다
      </p>

      <p className="text-center text-sm text-sage-500 mt-4">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" className="text-mint-600 font-semibold hover:text-mint-700 transition-colors">
          로그인
        </Link>
      </p>
    </div>
  )
}
