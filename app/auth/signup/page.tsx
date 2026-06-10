'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react'
import {
  isStrongPassword,
  isValidUsername,
  passwordRuleMessage,
  usernameRuleMessage,
} from '@/lib/account'

function getAppOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
}

function getSignupErrorMessage(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('already')) return '이미 사용 중인 아이디입니다.'
  if (normalized.includes('password')) return passwordRuleMessage
  return message || '회원가입 중 오류가 발생했습니다.'
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const strong = isStrongPassword(password)
  const level = Math.min(Math.max(Math.floor(password.length / 2), 1), 4)

  return (
    <div className="mt-2.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < level
                ? strong ? 'bg-mint-500' : 'bg-amber-400'
                : 'bg-sage-100 dark:bg-sage-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium transition-colors ${strong ? 'text-mint-600' : 'text-amber-500'}`}>
        {strong ? '안전한 비밀번호입니다' : passwordRuleMessage}
      </p>
    </div>
  )
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
  const identityVerified = Boolean(verificationToken)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const verifyIdentityOnServer = async (identityVerificationId: string) => {
    setVerifying(true)
    try {
      const response = await fetch('/api/identity/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identityVerificationId }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? '본인인증 확인에 실패했습니다.')
      }

      setVerificationToken(result.verificationToken)
      setVerifiedName(result.verifiedName)
      setPhoneLast4(result.phoneLast4 ?? '')
      toast.success('본인인증이 완료되었습니다.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '본인인증 확인에 실패했습니다.')
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    const redirectedId = searchParams.get('identityVerificationId')
    const errorMessage = searchParams.get('message')

    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    if (redirectedId && !identityVerified && !verifying) {
      verifyIdentityOnServer(redirectedId)
    }
  }, [searchParams, identityVerified, verifying])

  const handleIdentityVerification = async () => {
    if (!storeId || !channelKey) {
      toast.error('PortOne 환경변수가 설정되지 않았습니다.')
      return
    }

    if (!window.PortOne) {
      toast.error('본인인증 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    const identityVerificationId = `identity-verification-${crypto.randomUUID()}`
    setVerifying(true)

    try {
      const response = await window.PortOne.requestIdentityVerification({
        storeId,
        channelKey,
        identityVerificationId,
        redirectUrl: `${getAppOrigin()}/auth/signup`,
      })

      if (response.code) {
        throw new Error(response.message ?? '본인인증이 취소되었습니다.')
      }

      await verifyIdentityOnServer(response.identityVerificationId ?? identityVerificationId)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '본인인증에 실패했습니다.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedUsername = username.trim().toLowerCase()

    if (!identityVerified) {
      toast.error('회원가입 전에 본인인증을 완료해 주세요.')
      return
    }

    if (!isValidUsername(normalizedUsername)) {
      toast.error(usernameRuleMessage)
      return
    }

    if (!isStrongPassword(password)) {
      toast.error(passwordRuleMessage)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: normalizedUsername,
          password,
          verificationToken,
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? '회원가입에 실패했습니다.')
      }

      toast.success('회원가입이 완료되었습니다. 로그인해 주세요.')
      router.push('/auth/login')
    } catch (error) {
      toast.error(getSignupErrorMessage(error instanceof Error ? error.message : '회원가입에 실패했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
      <div
        className={`transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-sage-900 dark:text-sage-50 tracking-tight mb-2">시작해볼까요</h1>
          <p className="text-sage-400">본인인증 후 약속과 함께 복약을 관리하세요</p>
        </div>

        <div className="mb-6 rounded-3xl border border-sage-100 dark:border-sage-700 bg-white dark:bg-sage-800 p-5 shadow-sm">
          {identityVerified ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-mint-50 dark:bg-mint-900/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-mint-600 dark:text-mint-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-sage-900 dark:text-sage-50">본인인증 완료</p>
                <p className="mt-1 text-sm text-sage-500 dark:text-sage-400">
                  {verifiedName}님{phoneLast4 ? ` · 휴대폰 뒷자리 ${phoneLast4}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleIdentityVerification}
              disabled={verifying}
              className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/25 hover:shadow-mint-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              PASS 본인인증하기
            </button>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-sage-700 dark:text-sage-300 mb-1.5">이름</label>
            <input
              type="text"
              value={verifiedName}
              placeholder="본인인증 후 자동 입력"
              disabled
              className="input-base bg-sage-50 dark:bg-sage-700 text-sage-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-sage-700 dark:text-sage-300 mb-1.5">아이디</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="yaksok_user"
              required
              className="input-base"
            />
            <p className="mt-1 text-xs text-sage-400">영문 소문자, 숫자, 밑줄(_) 4~20자</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-sage-700 dark:text-sage-300 mb-1.5">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="대문자, 소문자, 특수문자 포함 8자 이상"
                required
                minLength={8}
                className="input-base pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sage-400 hover:text-sage-600 dark:hover:text-sage-200 p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                {showPw ? <EyeOff className="w-5 h-5" aria-hidden /> : <Eye className="w-5 h-5" aria-hidden />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <button
            type="submit"
            disabled={loading || !identityVerified}
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
          <span className="text-sage-500 dark:text-sage-400 underline cursor-pointer">이용약관</span> 및{' '}
          <span className="text-sage-500 dark:text-sage-400 underline cursor-pointer">개인정보처리방침</span>에 동의하게 됩니다
        </p>

        <p className="text-center text-sm text-sage-500 dark:text-sage-400 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-mint-600 dark:text-mint-400 font-semibold hover:text-mint-700 transition-colors">
            로그인
          </Link>
        </p>
      </div>
    </>
  )
}
