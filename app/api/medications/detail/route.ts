import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MEDICATION_COLUMNS = 'id,item_seq,item_name,entp_name,class_name,efficacy,usage_info,caution,side_effect,interaction_info,image_url,drug_shape,color_class1,color_class2,print_front,print_back,mark_code_front,mark_code_back,form_code_name,chart,created_at'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  const supabase = await createClient()

  const { data: med } = await supabase
    .from('medications')
    .select(MEDICATION_COLUMNS)
    .eq('id', id)
    .single()

  if (!med) return NextResponse.json({ error: '약품을 찾을 수 없습니다' }, { status: 404 })

  if (med.efficacy) {
    return NextResponse.json({ medication: med, hasDetail: true })
  }

  if (!med.item_seq) {
    return NextResponse.json({ medication: med, hasDetail: false })
  }

  const apiKey = process.env.MFDS_EASY_API_KEY ?? process.env.MFDS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ medication: med, hasDetail: false })
  }

  try {
    const url = new URL('https://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList')
    url.searchParams.set('serviceKey', apiKey)
    url.searchParams.set('itemSeq', med.item_seq)
    url.searchParams.set('type', 'json')
    url.searchParams.set('numOfRows', '1')

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const json = await res.json()
    const items: Record<string, string>[] = json?.body?.items ?? []

    if (!items.length) {
      return NextResponse.json({ medication: med, hasDetail: false })
    }

    const item = items[0]
    const updates: Record<string, string | null> = {
      efficacy:    item.efcyQesitm     ?? null,
      usage_info:  item.useMethodQesitm ?? null,
      caution:     item.atpnQesitm     ?? null,
      side_effect: item.seQesitm       ?? null,
      image_url:   item.itemImage      ?? med.image_url ?? null,
    }

    const patch = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== null))

    if (Object.keys(patch).length > 0) {
      await supabase.from('medications').update(patch).eq('id', id)
    }

    return NextResponse.json({
      medication: { ...med, ...patch },
      hasDetail: Object.keys(patch).length > 0,
    })

  } catch (err) {
    console.error('상세정보 조회 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json({ medication: med, hasDetail: false })
  }
}
