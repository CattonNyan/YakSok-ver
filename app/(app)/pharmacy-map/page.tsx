import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import Script from 'next/script'

const PharmacyMapClient = dynamic(
  () => import('@/components/pharmacy-map/PharmacyMapClient'),
  { ssr: false, loading: () => <div className="flex-1 bg-sage-100 animate-pulse rounded-2xl min-h-64" /> }
)

export const metadata = { title: '근처 약국 찾기 | 약속' }

export default async function PharmacyMapPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const naverMapClientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ''

  return (
    <div className="flex flex-col h-full">
      {naverMapClientId && (
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${naverMapClientId}&submodules=geocoder`}
          strategy="afterInteractive"
        />
      )}
      <PharmacyMapClient />
    </div>
  )
}
