import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────
// API 1: 의약품 제품 허가정보 (현재 보유 키 — MFDS_API_KEY)
//   엔드포인트: MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01
//   제공 정보: 약품명, 제조사, 이미지, 외형
//   응답 필드: ITEM_SEQ, ITEM_NAME, ENTP_NAME, ITEM_IMAGE (대문자)
//
// API 2: 의약품개요정보 e약은요 (선택 — MFDS_EASY_API_KEY)
//   엔드포인트: DrbEasyDrugInfoService/getDrbEasyDrugList
//   제공 정보: 효능, 용법, 주의사항, 부작용, 상호작용 (더 풍부)
//   신청: https://www.data.go.kr/data/15075057/openapi.do
// ─────────────────────────────────────────────

async function fetchFromHukajeongbo(q: string, apiKey: string) {
  const url = new URL('https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService01/getMdcinGrnIdntfcInfoList01')
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('item_name', q)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '10')
  url.searchParams.set('pageNo', '1')

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`허가정보 API HTTP 오류: ${res.status}`)

  const text = await res.text()
  console.log('식약처 API 응답 원문:', text.slice(0, 500))
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    // XML 에러 응답인 경우 (키 오류 등)
    throw new Error('API 응답이 JSON이 아닙니다. API 키를 확인해 주세요.')
  }

  const resultCode = json?.header?.resultCode ?? json?.response?.header?.resultCode
  if (resultCode && resultCode !== '00') {
    const msg = json?.header?.resultMsg ?? json?.response?.header?.resultMsg ?? 'API 오류'
    throw new Error(`식약처 API 에러 [${resultCode}]: ${msg}`)
  }

  const items: any[] = json?.body?.items ?? json?.response?.body?.items ?? []
  return items
    .filter((item: any) => item.ITEM_NAME)
    .map((item: any) => ({
      item_seq:    String(item.ITEM_SEQ ?? ''),
      item_name:   item.ITEM_NAME,
      entp_name:   item.ENTP_NAME ?? null,
      class_name:  item.CLASS_NAME ?? null,
      image_url:   item.ITEM_IMAGE ?? null,
      efficacy:    null,
      usage_info:  null,
      caution:     null,
      side_effect: null,
    }))
}

async function fetchFromEyakeunyyo(q: string, apiKey: string) {
  const url = new URL('https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList')
  url.searchParams.set('serviceKey', apiKey)
  url.searchParams.set('itemName', q)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', '10')

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`e약은요 API HTTP 오류: ${res.status}`)

  const text = await res.text()
  console.log('e약은요 API 응답 원문:', text.slice(0, 500))
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('e약은요 API 응답이 JSON이 아닙니다.')
  }

  console.log('e약은요 파싱 결과:', JSON.stringify(json?.body, null, 2))
  const items: any[] = json?.body?.items ?? []
  return items
    .filter((item: any) => item.itemName)
    .map((item: any) => ({
      item_seq:    item.itemSeq ?? '',
      item_name:   item.itemName,
      entp_name:   item.entpName ?? null,
      class_name:  null,
      image_url:   item.itemImage ?? null,
      efficacy:    item.efcyQesitm ?? null,
      usage_info:  item.useMethodQesitm ?? null,
      caution:     item.atpnQesitm ?? null,
      side_effect: item.seQesitm ?? null,
    }))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ items: [] })

  const supabase = createClient()

  // 1. Supabase DB 캐시 먼저 확인
  const { data: cached } = await supabase
    .from('medications')
    .select('*')
    .ilike('item_name', `%${q}%`)
    .limit(10)

  if (cached && cached.length > 0) {
    return NextResponse.json({ items: cached })
  }

  // 2. 환경변수 확인
  const primaryKey = process.env.MFDS_API_KEY
  const easyKey    = process.env.MFDS_EASY_API_KEY

  if (!primaryKey) {
    return NextResponse.json(
      { items: [], error: '.env.local에 MFDS_API_KEY가 설정되지 않았습니다.' },
      { status: 500 }
    )
  }

  try {
    let mapped: any[] = []

    // e약은요 키가 있으면 우선 사용 (효능·부작용 포함)
    if (easyKey) {
      try {
        mapped = await fetchFromEyakeunyyo(q, easyKey)
      } catch (e) {
        console.warn('e약은요 API 실패, 허가정보 API로 폴백:', e)
      }
    }

    // e약은요 결과 없으면 허가정보 API 사용
    if (mapped.length === 0) {
      mapped = await fetchFromHukajeongbo(q, primaryKey)
    }

    if (mapped.length === 0) {
    console.log('식약처 API 결과 없음. 검색어:', q)
    return NextResponse.json({ items: [] })
  }

    // 3. DB에 캐시 저장
    const toUpsert = mapped.filter(m => m.item_seq)
    if (toUpsert.length > 0) {
      await supabase
        .from('medications')
        .upsert(toUpsert, { onConflict: 'item_seq', ignoreDuplicates: true })
    }

    // 4. DB에서 uuid 포함한 최종 결과 반환
    const { data: fresh } = await supabase
      .from('medications')
      .select('*')
      .ilike('item_name', `%${q}%`)
      .limit(10)

    return NextResponse.json({ items: fresh ?? mapped })

  } catch (error: any) {
    console.error('식약처 API 오류:', error.message)
    return NextResponse.json(
      { items: [], error: error.message ?? '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
