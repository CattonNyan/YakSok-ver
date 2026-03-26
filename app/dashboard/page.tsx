import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  // 오늘 활성 스케줄 + 의약품 정보
  const { data: schedules } = await supabase
    .from('schedules')
    .select(`*, medication:medications(*)`)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .lte('start_date', today)
    .or(`end_date.is.null,end_date.gte.${today}`)

  // 오늘 복약 기록
  const { data: logs } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', today)

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return (
    <DashboardClient
      schedules={schedules ?? []}
      logs={logs ?? []}
      userName={profile?.name ?? ''}
      today={today}
      userId={user.id}
    />
  )
}
