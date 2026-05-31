import { NextResponse } from 'next/server'
import { createVerificationToken, getPhoneLast4, hashIdentityValue } from '@/lib/identity'
import { createAdminClient } from '@/lib/supabase/admin'

type PortOneVerifiedCustomer = {
  ci?: string
  di?: string
  name?: string
  phoneNumber?: string
  birthDate?: string
  gender?: string
}

type PortOneIdentityVerification = {
  id?: string
  status?: string
  verifiedCustomer?: PortOneVerifiedCustomer
}

function getPortOneSecret() {
  const secret = process.env.PORTONE_API_SECRET
  if (!secret) throw new Error('PORTONE_API_SECRET is not configured')
  return secret
}

export async function POST(request: Request) {
  try {
    const { identityVerificationId } = await request.json()

    if (!identityVerificationId || typeof identityVerificationId !== 'string') {
      return NextResponse.json({ error: '본인인증 ID가 없습니다.' }, { status: 400 })
    }

    const portOneResponse = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      {
        headers: {
          Authorization: `PortOne ${getPortOneSecret()}`,
        },
        cache: 'no-store',
      }
    )

    if (!portOneResponse.ok) {
      return NextResponse.json({ error: '본인인증 결과를 확인할 수 없습니다.' }, { status: 502 })
    }

    const result = await portOneResponse.json()
    const identityVerification: PortOneIdentityVerification =
      result.identityVerification ?? result

    if (identityVerification.status !== 'VERIFIED') {
      return NextResponse.json({ error: '본인인증이 완료되지 않았습니다.' }, { status: 400 })
    }

    const customer = identityVerification.verifiedCustomer
    if (!customer?.name) {
      return NextResponse.json({ error: '본인인증 고객 정보가 부족합니다.' }, { status: 400 })
    }

    const ciHash = customer.ci ? hashIdentityValue(customer.ci) : null
    const diHash = customer.di ? hashIdentityValue(customer.di) : null
    const verificationToken = createVerificationToken()
    const verificationTokenHash = hashIdentityValue(verificationToken)
    const supabase = createAdminClient()

    const duplicateFilters = [
      ciHash ? `ci_hash.eq.${ciHash}` : null,
      diHash ? `di_hash.eq.${diHash}` : null,
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

    const { error: insertError } = await supabase.from('identity_verifications').insert({
      verification_token_hash: verificationTokenHash,
      portone_identity_verification_id: identityVerificationId,
      ci_hash: ciHash,
      di_hash: diHash,
      verified_name: customer.name,
      phone_last4: getPhoneLast4(customer.phoneNumber),
      birth_date: customer.birthDate ?? null,
      gender: customer.gender ?? null,
      status: 'verified',
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: '이미 처리된 본인인증입니다. 다시 시도해 주세요.' }, { status: 409 })
      }
      throw insertError
    }

    return NextResponse.json({
      verificationToken,
      verifiedName: customer.name,
      phoneLast4: getPhoneLast4(customer.phoneNumber),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '본인인증 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
