'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Trash2, ToggleLeft, ToggleRight, Sun, Coffee, Sunset, Moon } from 'lucide-react'
import type { Schedule, TimeSlot } from '@/types'
import clsx from 'clsx'

const SLOT_LABELS: Record<TimeSlot, { label: string; icon: React.ElementType }> = {
  morning: { label: '아침', icon: Sun },
  lunch:   { label: '점심', icon: Coffee },
  dinner:  { label: '저녁', icon: Sunset },
  bedtime: { label: '취침 전', icon: Moon },
}

export default function ScheduleList({ schedules: initial, userId }: {
  schedules: (Schedule & { medication: any })[]
  userId: string
}) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState(initial)

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('schedules').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
      toast.success(current ? '일정을 중단했습니다' : '일정을 재개했습니다')
    }
  }

  const deleteSchedule = async (id: string) => {
    if (!confirm('이 복약 일정을 삭제하시겠습니까?')) return
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      toast.success('삭제되었습니다')
    }
  }

  if (schedules.length === 0) {
    return (
      <div className="card text-center py-14">
        <p className="text-4xl mb-3">💊</p>
        <p className="text-sage-500 font-medium">등록된 복약 일정이 없습니다</p>
        <p className="text-sm text-sage-400 mt-1">약 추가 버튼을 눌러 시작하세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {schedules.map(s => (
        <div key={s.id} className={clsx('card transition-opacity', !s.is_active && 'opacity-60')}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 bg-sage-100 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-xl">💊</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sage-900 truncate">{s.medication?.item_name}</p>
                <p className="text-xs text-sage-500 mt-0.5">{s.medication?.entp_name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.time_slots.map((slot: TimeSlot) => {
                    const { label, icon: Icon } = SLOT_LABELS[slot]
                    return (
                      <span key={slot} className="inline-flex items-center gap-1 text-xs bg-mint-50 text-mint-700 px-2 py-0.5 rounded-full">
                        <Icon className="w-3 h-3" />{label}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-sage-400 mt-1">
                  {s.start_date} {s.end_date ? `~ ${s.end_date}` : '~ 계속'}
                  {s.dosage && ` · ${s.dosage}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleActive(s.id, s.is_active)}
                className="p-1.5 rounded-lg hover:bg-sage-50 text-sage-400 hover:text-sage-600 transition-colors">
                {s.is_active
                  ? <ToggleRight className="w-5 h-5 text-mint-500" />
                  : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button onClick={() => deleteSchedule(s.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-sage-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
