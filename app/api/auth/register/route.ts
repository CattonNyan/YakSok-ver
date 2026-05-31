import { NextResponse } from 'next/server'
import {
  isStrongPassword,
  isValidUsername,
  passwordRuleMessage,
  usernameRuleMessage,
  usernameToAuthEmail,
} from '@/lib/account'
import { hashIdentityValue } from '@/lib/identity'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { username, password, verificationToken } = await request.json()
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : ''
    const internalEmail = usernameToAuthEmail(normalizedUsername)

    if (!normalizedUsername || !password || typeof password !== 'string') {
      return NextResponse.json({ error: '아이디와 비밀번호를 입력해 주세요.' }, { status: 400 })
    }

    if (!isValidUsername(normalizedUsername)) {
      return NextResponse.json({ error: usernameRuleMessage }, { status: 400 })
    }

    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: passwordRuleMessage }, { status: 400 })
    }

    if (!verificationToken || typeof verificationToken !== 'string') {
      return NextResponse.json({ error: '본인인증을 먼저 완료해 주세요.' }, { status: 400 })
    }

    const verificationTokenHash = hashIdentityValue(verificationToken)
    const supabase = createAdminClient()

    const { data: verification, error: verificationError } = await supabase
      .from('identity_verifications')
      .select('*')
      .eq('verification_token_hash', verificationTokenHash)
      .eq('status', 'verified')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (verificationError) throw verificationError
    if (!verification) {
      return NextResponse.json({ error: '본인인증 정보가 만료되었거나 유효하지 않습니다.' }, { status: 400 })
    }

    const duplicateFilters = [
      verification.ci_hash ? `ci_hash.eq.${verification.ci_hash}` : null,
      verification.di_hash ? `di_hash.eq.${verification.di_hash}` : null,
    ].filter(Boolean)

    if (duplicateFilters.length > 0) {
      const { data: duplicateProfile, error: duplicateError } = await supabase
        .from('profiles')
        .select('id')
        .or(duplicateFilters.join(','))
        .maybeSingle()

      if (duplicateError) throw duplicateError
      if (duplicateProfile) {
        return NextResponse.json({ error: '이미 본인인증을 완료한 계정이 있습니다.' }, { status: 409 })
      }
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUsername,
        full_name: verification.verified_name,
        provider: 'email',
      },
    })

    if (createUserError || !createdUser.user) {
      const message = createUserError?.message ?? '회원가입에 실패했습니다.'
      if (message.toLowerCase().includes('already')) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const userId = createdUser.user.id
    const now = new Date().toISOString()

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email: internalEmail,
        username: normalizedUsername,
        name: verification.verified_name,
        provider: 'email',
        identity_verified: true,
        identity_verified_at: now,
        verified_name: verification.verified_name,
        verified_phone_last4: verification.phone_last4,
        ci_hash: verification.ci_hash,
        di_hash: verification.di_hash,
        identity_provider: 'portone',
        updated_at: now,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      await supabase.auth.admin.deleteUser(userId)
      throw profileError
    }

    const { error: markUsedError } = await supabase
      .from('identity_verifications')
      .update({ used_at: now })
      .eq('id', verification.id)
      .is('used_at', null)

    if (markUsedError) throw markUsedError

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
