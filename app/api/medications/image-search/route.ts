import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BASE64_BYTES = 5 * 1024 * 1024
const MEDICATION_COLUMNS = 'id,item_seq,item_name,entp_name,class_name,efficacy,usage_info,caution,side_effect,interaction_info,image_url,drug_shape,color_class1,color_class2,print_front,print_back,mark_code_front,mark_code_back,form_code_name,chart,created_at'

type ImageCandidate = {
  code?: string
  name?: string
  confidence?: number
  accepted?: boolean
  ocrText?: string
  ocrNormalized?: string
  bbox?: number[]
}

function normalizeApiUrl(url: string) {
  return url.replace(/\/health\/?$/, '').replace(/\/$/, '')
}

function predictionTerms(candidate: ImageCandidate) {
  return [candidate.name, candidate.ocrNormalized, candidate.ocrText]
    .filter((value): value is string => Boolean(value && value.trim().length >= 2))
    .map(value => value.trim())
}

async function findMedication(supabase: Awaited<ReturnType<typeof createClient>>, term: string) {
  const searchColumns = ['item_name', 'print_front', 'print_back', 'mark_code_front', 'mark_code_back']

  for (const column of searchColumns) {
    const { data } = await supabase
      .from('medications')
      .select(MEDICATION_COLUMNS)
      .ilike(column, `%${term}%`)
      .limit(1)

    if (data?.[0]) return data[0]
  }

  return null
}

async function readImageSearchPayload(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const imageValue = formData.get('image')

    if (typeof imageValue === 'string') return { image: imageValue, imageCandidates: [] as ImageCandidate[] }
    if (imageValue && typeof imageValue === 'object' && 'arrayBuffer' in imageValue) {
      const imageFile = imageValue as File
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      return {
        image: `data:${imageFile.type || 'image/jpeg'};base64,${buffer.toString('base64')}`,
        imageCandidates: [] as ImageCandidate[],
      }
    }

    return { image: null, imageCandidates: [] as ImageCandidate[] }
  }

  const body = await request.json()
  return {
    image: typeof body?.image === 'string' ? body.image : null,
    imageCandidates: Array.isArray(body?.imageCandidates) ? body.imageCandidates as ImageCandidate[] : [],
  }
}

export async function GET() {
  const apiUrl = process.env.PILL_IMAGE_API_URL
  const apiKey = process.env.PILL_IMAGE_API_KEY

  if (!apiUrl) {
    return NextResponse.json({
      ok: false,
      configured: false,
      hasApiKey: Boolean(apiKey),
      error: 'PILL_IMAGE_API_URL is not set',
    }, { status: 500 })
  }

  const baseUrl = normalizeApiUrl(apiUrl)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10_000)

  try {
    const healthRes = await fetch(`${baseUrl}/health`, {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      signal: controller.signal,
    })
    const body = await healthRes.text()

    return NextResponse.json({
      ok: healthRes.ok,
      configured: true,
      hasApiKey: Boolean(apiKey),
      apiBase: baseUrl,
      status: healthRes.status,
      health: body ? JSON.parse(body) : null,
    }, { status: healthRes.ok ? 200 : 502 })
  } catch (error) {
    console.error('Pill image health check failed:', error)
    return NextResponse.json({
      ok: false,
      configured: true,
      hasApiKey: Boolean(apiKey),
      apiBase: baseUrl,
      error: 'Pill image API health check failed',
    }, { status: 504 })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function POST(request: Request) {
  try {
    const { image, imageCandidates: providedCandidates } = await readImageSearchPayload(request)
    if (!image && providedCandidates.length === 0) {
      return NextResponse.json({ candidates: [] }, { status: 400 })
    }

    const [, base64Data] = image ? image.split(',') : []
    if (image && base64Data && Buffer.byteLength(base64Data, 'base64') > MAX_BASE64_BYTES) {
      return NextResponse.json(
        { candidates: [], error: '이미지 크기는 5MB를 초과할 수 없습니다.' },
        { status: 413 }
      )
    }

    let imageCandidates: ImageCandidate[] = providedCandidates

    if (imageCandidates.length === 0 && image) {
      const apiUrl = process.env.PILL_IMAGE_API_URL
      if (!apiUrl) {
        return NextResponse.json(
          { candidates: [], error: 'PILL_IMAGE_API_URL이 설정되지 않았습니다.' },
          { status: 500 }
        )
      }

      const apiKey = process.env.PILL_IMAGE_API_KEY
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30_000)

      let modelRes: Response
      try {
        modelRes = await fetch(`${normalizeApiUrl(apiUrl)}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-API-Key': apiKey } : {}),
          },
          body: JSON.stringify({ image }),
          signal: controller.signal,
        })
      } catch (error) {
        console.error('Pill image API request failed:', error)
        return NextResponse.json(
          { candidates: [], error: '이미지 분석 서버에 연결하지 못했습니다. EC2 보안 그룹에서 8010 포트가 외부에 열려 있는지 확인해주세요.' },
          { status: 504 }
        )
      } finally {
        clearTimeout(timeoutId)
      }

      if (!modelRes.ok) {
        const err = await modelRes.text()
        console.error('Pill image API error:', modelRes.status, err)
        return NextResponse.json(
          { candidates: [], error: '이미지 분석에 실패했습니다.' },
          { status: 502 }
        )
      }

      const modelData = await modelRes.json()
      imageCandidates = Array.isArray(modelData?.candidates) ? modelData.candidates : []
    }

    if (imageCandidates.length === 0) {
      return NextResponse.json({ candidates: [] })
    }

    const supabase = await createClient()
    const results = []
    const seen = new Set<string>()

    for (const candidate of imageCandidates.slice(0, 5)) {
      const terms = predictionTerms(candidate)
      let matchedMedication: any = null

      for (const term of terms) {
        matchedMedication = await findMedication(supabase, term)
        if (matchedMedication) {
          break
        }
      }

      const key = matchedMedication?.id ?? candidate.code ?? candidate.name
      if (!key || seen.has(key)) continue
      seen.add(key)

      if (matchedMedication) {
        results.push({
          ...matchedMedication,
          image_prediction: candidate,
        })
      } else {
        results.push({
          id: crypto.randomUUID(),
          item_name: candidate.name ?? candidate.ocrText ?? '알 수 없는 알약',
          entp_name: null,
          efficacy: null,
          image_url: null,
          image_prediction: candidate,
        })
      }
    }

    return NextResponse.json({ candidates: results })

  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json(
      { candidates: [], error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
