/**
 * 식약처 낱알식별 데이터 전체 임포트 스크립트
 *
 * 실행 방법:
 *   node scripts/import-pill-shapes.mjs
 *
 * 사전 조건:
 *   - .env.local에 MFDS_GRAIN_API_KEY (또는 MFDS_API_KEY), NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
 *   - Supabase SQL 에디터에서 supabase-schema.sql 낱알식별 마이그레이션 블록 실행 완료
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// .env.local 수동 파싱 (dotenv 없이)
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
const env = {}
try {
  readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
} catch { console.error('❌ .env.local 파일을 찾을 수 없습니다.'); process.exit(1) }

const SUPABASE_URL     = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY          = env.MFDS_GRAIN_API_KEY ?? env.MFDS_API_KEY
const BASE_URL         = 'https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03'
const ROWS_PER_PAGE    = 100
const BATCH_SIZE       = 200

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !API_KEY) {
  console.error('❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MFDS_GRAIN_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function mapItem(raw) {
  if (!raw.ITEM_SEQ || !raw.ITEM_NAME) return null
  return {
    item_seq:        String(raw.ITEM_SEQ),
    item_name:       raw.ITEM_NAME,
    entp_name:       raw.ENTP_NAME       || null,
    class_name:      raw.CLASS_NAME      || null,
    image_url:       raw.ITEM_IMAGE      || null,
    drug_shape:      raw.DRUG_SHAPE      || null,
    color_class1:    raw.COLOR_CLASS1    || null,
    color_class2:    raw.COLOR_CLASS2    || null,
    print_front:     raw.PRINT_FRONT     || null,
    print_back:      raw.PRINT_BACK      || null,
    mark_code_front: raw.MARK_CODE_FRONT || null,
    mark_code_back:  raw.MARK_CODE_BACK  || null,
    form_code_name:  raw.FORM_CODE_NAME  || null,
    chart:           raw.CHART           || null,
  }
}

async function fetchPage(page) {
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

async function upsertBatch(items) {
  // 배치 내 중복 item_seq 제거
  const seen = new Set()
  const deduped = items.filter(item => {
    if (seen.has(item.item_seq)) return false
    seen.add(item.item_seq)
    return true
  })
  const { error } = await supabase
    .from('medications')
    .upsert(deduped, { onConflict: 'item_seq' })
  if (error) throw new Error(`Supabase upsert 오류: ${error.message}`)
}

async function main() {
  console.log('🚀 낱알식별 데이터 임포트 시작\n')

  const { totalCount } = await fetchPage(1)
  const totalPages = Math.ceil(totalCount / ROWS_PER_PAGE)
  console.log(`📦 총 ${totalCount.toLocaleString()}개 항목, ${totalPages}페이지\n`)

  let totalImported = 0
  let totalSkipped  = 0
  let buffer        = []

  const flush = async () => {
    if (buffer.length === 0) return
    await upsertBatch(buffer)
    totalImported += buffer.length
    buffer = []
  }

  const startTime = Date.now()

  for (let page = 1; page <= totalPages; page++) {
    try {
      const { items } = await fetchPage(page)

      for (const raw of items) {
        const mapped = mapItem(raw)
        mapped ? buffer.push(mapped) : totalSkipped++
      }

      if (buffer.length >= BATCH_SIZE) await flush()

      const pct     = ((page / totalPages) * 100).toFixed(1)
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
      process.stdout.write(
        `\r  진행: ${page}/${totalPages} (${pct}%) | 저장: ${totalImported.toLocaleString()}개 | ${elapsed}초 경과`
      )

    } catch (err) {
      console.error(`\n⚠️  ${page}페이지 오류: ${err.message} — 2초 후 재시도...`)
      await new Promise(r => setTimeout(r, 2000))
      page--
    }
  }

  await flush()

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n\n✅ 임포트 완료! (${elapsed}초)`)
  console.log(`   저장: ${totalImported.toLocaleString()}개`)
  if (totalSkipped > 0) console.log(`   건너뜀: ${totalSkipped}개 (ITEM_SEQ 없음)`)
}

main().catch(e => { console.error('\n❌ 오류:', e.message); process.exit(1) })
