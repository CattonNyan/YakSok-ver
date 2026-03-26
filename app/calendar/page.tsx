import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from '@/components/dashboard/CalendarClient'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default async function CalendarPage({ searchParams }: { searchParams: { month?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const monthStr = searchParams.month ?? format(new Date(), 'yyyy-MM')
  const monthDate = new Date(monthStr + '-01')
  const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const end   = format(endOfMonth(monthDate),   'yyyy-MM-dd')

  const { data: logs } = await supabase
    .from('medication_logs')
    .select('log_date, taken, time_slot')
    .eq('user_id', user.id)
    .gte('log_date', start)
    .lte('log_date', end)

  // 날짜별 완료율 계산
  const dateMap: Record<string, { total: number; taken: number }> = {}
  for (const log of logs ?? []) {
    if (!dateMap[log.log_date]) dateMap[log.log_date] = { total: 0, taken: 0 }
    dateMap[log.log_date].total++
    if (log.taken) dateMap[log.log_date].taken++
  }

  return <CalendarClient dateMap={dateMap} currentMonth={monthStr} />
}
