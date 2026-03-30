import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)))
}

async function searchNaverGrid(
  lat: number, lng: number,
  south: number, west: number, north: number, east: number,
  clientId: string, clientSecret: string
) {
  const midLat = (south + north) / 2
  const midLng = (west + east) / 2
  const centers = [
    { lat: (south + midLat) / 2, lng: (west + midLng) / 2 },   // 남서
    { lat: (south + midLat) / 2, lng: (midLng + east) / 2 },   // 남동
    { lat: (midLat + north) / 2, lng: (west + midLng) / 2 },   // 북서
    { lat: (midLat + north) / 2, lng: (midLng + east) / 2 },   // 북동
  ]

  const getAreaQuery = async (clat: number, clng: number) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${clat}&lon=${clng}&format=json&accept-language=ko`,
        { headers: { 'User-Agent': 'YakSok/1.0' }, signal: controller.signal }
      )
      const addr = (await r.json()).address ?? {}
      const dong = addr.suburb || addr.quarter || addr.neighbourhood || ''
      const gu   = addr.city_district || addr.county || ''
      return dong || gu || '약국'
    } catch {
      return '약국'
    } finally {
      clearTimeout(timer)
    }
  }

  const areas = await Promise.all(centers.map(c => getAreaQuery(c.lat, c.lng)))

  const uniqueAreas = Array.from(new Set(areas.map(a => `약국 ${a}`)))

  const fetchQuery = (q: string) =>
    fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(q)}&display=5&start=1&sort=comment`,
      {
        headers: { 'X-Naver-Client-Id': clientId, 'X-Naver-Client-Secret': clientSecret },
        next: { revalidate: 0 },
      }
    )

  const jsons = await Promise.all(
    (await Promise.all(uniqueAreas.map(fetchQuery)))
      .map(r => r.ok ? r.json() : { items: [] })
  )

  const seen = new Set<string>()
  return jsons
    .flatMap((d: any) => d.items ?? [])
    .filter((item: any) => {
      if (!item.mapx || !item.mapy) return false
      const key = `${item.mapx},${item.mapy}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((item: any) => ({
      name: item.title.replace(/<[^>]+>/g, ''),
      address: item.address,
      roadAddress: item.roadAddress,
      telephone: item.telephone,
      link: item.link || '',
      category: item.category || '건강,의료>약국',
      lat: parseInt(item.mapy, 10) / 10_000_000,
      lng: parseInt(item.mapx, 10) / 10_000_000,
    }))
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId     = process.env.NAVER_CLIENT_ID     ?? ''
  const clientSecret = process.env.NAVER_CLIENT_SECRET ?? ''
  if (!clientId || !clientSecret) {
    return NextResponse.json({ items: [], error: 'NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수를 설정해주세요.' })
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  if (isNaN(lat) || isNaN(lng)) return NextResponse.json({ items: [] })

  const delta = 0.014
  const south = parseFloat(searchParams.get('south') || '') || lat - delta
  const west  = parseFloat(searchParams.get('west')  || '') || lng - delta * 1.3
  const north = parseFloat(searchParams.get('north') || '') || lat + delta
  const east  = parseFloat(searchParams.get('east')  || '') || lng + delta * 1.3

  const userLatRaw = parseFloat(searchParams.get('userLat') || '')
  const userLngRaw = parseFloat(searchParams.get('userLng') || '')
  const userLat = isNaN(userLatRaw) ? lat : userLatRaw
  const userLng = isNaN(userLngRaw) ? lng : userLngRaw

  const rawItems = await searchNaverGrid(lat, lng, south, west, north, east, clientId, clientSecret)

  const maxDistance = 3000
  const items = rawItems
    .map((p: any) => ({
      ...p,
      _distFromCenter: haversineMeters(lat, lng, p.lat, p.lng),
      distance: haversineMeters(userLat, userLng, p.lat, p.lng),
    }))
    .filter((p: any) => p._distFromCenter <= maxDistance)
    .sort((a: any, b: any) => a._distFromCenter - b._distFromCenter)
    .map(({ _distFromCenter: _, ...rest }: any) => rest)

  return NextResponse.json({ items })
}
