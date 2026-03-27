/**
 * 식약처 낱알식별 데이터 전체 임포트 스크립트
 *
 * 실행 방법:
 *   npx tsx scripts/import-pill-shapes.ts
 *
 * 사전 조건:
 *   - .env.local에 MFDS_GRAIN_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 *   - supabase-schema.sql의 낱알식별 컬럼 마이그레이션 실행 완료
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_KEY           = process.env.MFDS_GRAIN_API_KEY ?? process.env.MFDS_API_KEY!
const BASE_URL          = 'https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03'
const ROWS_PER_PAGE     = 100
const UPSERT_BATCH_SIZE = 200

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
  console.error('❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MFDS_GRAIN_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface PillItem {
  item_seq:         string
  item_name:        string
  entp_name:        string | null
  class_name:       string | null
  image_url:        string | null
  drug_shape:       string | null
  color_class1:     string | null
  color_class2:     string | null
  print_front:      string | null
  print_back:       string | null
  mark_code_front:  string | null
  mark_code_back:   string | null
  form_code_name:   string | null
  chart:            string | null
}

function mapItem(raw: any): PillItem | null {
  if (!raw.ITEM_SEQ || !raw.ITEM_NAME) return null
  return {
    item_seq:        String(raw.ITEM_SEQ),
    item_name:       raw.ITEM_NAME,
    entp_name:       raw.ENTP_NAME        ?? null,
    class_name:      raw.CLASS_NAME       ?? null,
    image_url:       raw.ITEM_IMAGE       ?? null,
    drug_shape:      raw.DRUG_SHAPE       ?? null,
    color_class1:    raw.COLOR_CLASS1     ?? null,
    color_class2:    raw.COLOR_CLASS2     ?? null,
    print_front:     raw.PRINT_FRONT      ?? null,
    print_back:      raw.PRINT_BACK       ?? null,
    mark_code_front: raw.MARK_CODE_FRONT  ?? null,
    mark_code_back:  raw.MARK_CODE_BACK   ?? null,
    form_code_name:  raw.FORM_CODE_NAME   ?? null,
    chart:           raw.CHART            ?? null,
  }
}

async function fetchPage(page: number): Promise<{ items: any[]; totalCount: number }> {
  const url = new URL(BASE_URL)
  url.searchParams.set('serviceKey', API_KEY)
  url.searchParams.set('type', 'json')
  url.searchParams.set('numOfRows', String(ROWS_PER_PAGE))
  url.searchParams.set('pageNo', String(page))

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const body = json?.body ?? json?.response?.body
  return {
    items:      body?.items      ?? [],
    totalCount: body?.totalCount ?? 0,
  }
}

async function upsertBatch(items: PillItem[]) {
  const { error } = await supabase
    .from('medications')
    .upsert(items, { onConflict: 'item_seq' })

  if (error) throw new Error(`Supabase upsert 오류: ${error.message}`)
}

async function main() {
  console.log('🚀 낱알식별 데이터 임포트 시작\n')

  // 1페이지로 총 개수 확인
  const { totalCount } = await fetchPage(1)
  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE)
  console.log(`📦 총 ${totalCount.toLocaleString()}개 항목, ${totalPages}페이지\n`)

  let totalImported = 0
  let totalSkipped  = 0
  let buffer: PillItem[] = []

  const flush = async () => {
    if (buffer.length === 0) return
    await upsertBatch(buffer)
    totalImported += buffer.length
    buffer = []
  }

  for (let page = 1; page <= totalPages; page++) {
    try {
      const { items } = await fetchPage(page)

      for (const raw of items) {
        const mapped = mapItem(raw)
        if (mapped) {
          buffer.push(mapped)
        } else {
          totalSkipped++
        }
      }

      if (buffer.length >= UPSERT_BATCH_SIZE) await flush()

      // 진행률 표시
      const pct = ((page / totalPages) * 100).toFixed(1)
      process.stdout.write(`\r  진행: ${page}/${totalPages} (${pct}%) — 저장됨: ${totalImported.toLocaleString()}개`)

    } catch (err: any) {
      console.error(`\n⚠️  ${page}페이지 오류: ${err.message} — 재시도 중...`)
      await new Promise(r => setTimeout(r, 2000))
      page-- // 재시도
    }
  }

  await flush() // 나머지 처리

  console.log(`\n\n✅ 임포트 완료!`)
  console.log(`   저장: ${totalImported.toLocaleString()}개`)
  console.log(`   건너뜀: ${totalSkipped}개 (ITEM_SEQ 없음)`)
}

main().catch(e => {
  console.error('❌ 오류:', e.message)
  process.exit(1)
})
