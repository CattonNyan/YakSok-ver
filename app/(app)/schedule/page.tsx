export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ScheduleList from '@/components/schedule/ScheduleList'

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`id,user_id,medication_id,start_date,end_date,time_slots,dosage,memo,is_active,created_at,medication:medications(id,item_name,entp_name,image_url)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-mint-600 tracking-widest uppercase mb-1">My Medications</p>
          <h1 className="text-3xl font-bold text-sage-900 tracking-tight">복약 일정</h1>
          <p className="text-sage-400 mt-1">복용 중인 약을 관리하세요</p>
        </div>
        <Link
          href="/schedule/new"
          className="inline-flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold px-5 py-2.5 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/20 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" /> 약 추가
        </Link>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ScheduleList schedules={(schedules ?? []) as any} />
    </div>
  )
}
