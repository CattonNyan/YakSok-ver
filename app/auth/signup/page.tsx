'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
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

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [verifiedName, setVerifiedName] = useState('')
  const [phoneLast4, setPhoneLast4] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(false)

  const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID
  const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY
  const identityVerified = Boolean(verificationToken)

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
      <div className="card shadow-lg">
        <h1 className="text-2xl font-bold text-sage-900 mb-1">회원가입</h1>
        <p className="text-sm text-sage-500 mb-6">본인인증 후 약속과 함께 복약을 관리하세요</p>

        <div className="mb-6 rounded-xl border border-sage-200 bg-sage-50 p-4">
          {identityVerified ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-mint-600" />
              <div>
                <p className="text-sm font-semibold text-sage-900">본인인증 완료</p>
                <p className="mt-1 text-sm text-sage-600">
                  {verifiedName}님{phoneLast4 ? ` · 휴대폰 뒷자리 ${phoneLast4}` : ''}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleIdentityVerification}
              disabled={verifying}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              PASS 본인인증하기
            </button>
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">이름</label>
            <input
              type="text"
              value={verifiedName}
              placeholder="본인인증 후 자동 입력"
              disabled
              className="input-base bg-sage-50 text-sage-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">아이디</label>
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
            <label className="block text-sm font-medium text-sage-700 mb-1.5">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="대문자, 소문자, 특수문자 포함 8자 이상"
              required
              minLength={8}
              className="input-base"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !identityVerified}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            가입하기
          </button>
        </form>

        <p className="text-center text-xs text-sage-400 mt-4 leading-relaxed">
          가입하면 <span className="underline">이용약관</span> 및 <span className="underline">개인정보처리방침</span>에 동의하게 됩니다
        </p>
        <p className="text-center text-sm text-sage-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/auth/login" className="text-mint-600 font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </>
  )
}
