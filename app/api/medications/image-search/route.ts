import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { image } = await request.json()
    if (!image) return NextResponse.json({ candidates: [] }, { status: 400 })

    const apiKey = process.env.GOOGLE_VISION_API_KEY
    if (!apiKey) {
      return NextResponse.json({ candidates: [], error: 'GOOGLE_VISION_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
    }

    const [header, base64Data] = image.split(',')

    // Cloud Vision API 호출 — 텍스트 감지
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Data },
            features: [
              { type: 'TEXT_DETECTION',  maxResults: 10 },
              { type: 'LABEL_DETECTION', maxResults: 10 },
            ],
          }],
        }),
      }
    )

    if (!visionRes.ok) {
      const err = await visionRes.text()
      console.error('Cloud Vision 오류:', err)
      return NextResponse.json({ candidates: [], error: '이미지 분석에 실패했습니다.' }, { status: 500 })
    }

    const visionData = await visionRes.json()
    console.log('Vision 응답:', JSON.stringify(visionData, null, 2))

    // 감지된 텍스트 추출
    const detectedText = visionData?.responses?.[0]?.fullTextAnnotation?.text ?? ''
    const labels = visionData?.responses?.[0]?.labelAnnotations?.map((l: any) => l.description) ?? []

    if (!detectedText && labels.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    // 텍스트에서 약품명 추출 — 첫 번째 줄이 보통 약품명
    const lines = detectedText.split('\n').map((l: string) => l.trim()).filter(Boolean)
    const possibleNames = lines.slice(0, 3) // 상위 3줄

    if (possibleNames.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    // DB에서 약품 검색
    const supabase = createClient()
    const enriched = []

    for (const name of possibleNames) {
      if (name.length < 2) continue
      const { data: dbMed } = await supabase
        .from('medications')
        .select('*')
        .ilike('item_name', `%${name}%`)
        .limit(1)
        .single()

      if (dbMed) {
        enriched.push(dbMed)
      } else {
        enriched.push({
          id: crypto.randomUUID(),
          item_name: name,
          entp_name: null,
          efficacy: null,
          image_url: null,
        })
      }
    }

    if (enriched.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    return NextResponse.json({ candidates: enriched })

  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json({ candidates: [], error: '분석 중 오류가 발생했습니다.' }, { status: 500 })
  }
}