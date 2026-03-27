import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MEDICATION_COLUMNS = 'id,item_seq,item_name,entp_name,class_name,efficacy,image_url,drug_shape,color_class1,color_class2,print_front,print_back,mark_code_front,mark_code_back,form_code_name,chart,created_at'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const drug_shape   = searchParams.get('drug_shape')   ?? ''
  const color_class1 = searchParams.get('color_class1') ?? ''
  const color_class2 = searchParams.get('color_class2') ?? ''
  const mark_text    = searchParams.get('mark_text')    ?? ''
  const form_code    = searchParams.get('form_code')    ?? ''

  if (!drug_shape && !color_class1 && !color_class2 && !mark_text && !form_code) {
    return NextResponse.json({ items: [] })
  }

  try {
    const supabase = createClient()

    let query = supabase
      .from('medications')
      .select(MEDICATION_COLUMNS)
      .limit(50)

    if (drug_shape)   query = query.eq('drug_shape', drug_shape)
    if (color_class1) query = query.eq('color_class1', color_class1)
    if (color_class2) query = query.eq('color_class2', color_class2)
    if (form_code)    query = query.eq('form_code_name', form_code)

    if (mark_text) {
      const pattern = `%${mark_text}%`
      query = query.or(
        `print_front.ilike.${pattern},print_back.ilike.${pattern},mark_code_front.ilike.${pattern},mark_code_back.ilike.${pattern}`
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase 모양 검색 오류:', error.message)
      return NextResponse.json(
        { items: [], error: 'DB 검색 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items: data ?? [] })

  } catch (err) {
    console.error('모양 검색 오류:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { items: [], error: err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
