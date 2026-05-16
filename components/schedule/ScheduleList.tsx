'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Trash2, Sun, Coffee, Sunset, Moon, X, Check, Power, CalendarPlus } from 'lucide-react'
import type { Schedule, TimeSlot, Medication } from '@/types'
import clsx from 'clsx'
import Link from 'next/link'

const SLOT_LABELS: Record<TimeSlot, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  morning: { label: '아침',    icon: Sun,    color: 'text-amber-500',  bg: 'bg-amber-50' },
  lunch:   { label: '점심',    icon: Coffee, color: 'text-orange-500', bg: 'bg-orange-50' },
  dinner:  { label: '저녁',    icon: Sunset, color: 'text-purple-500', bg: 'bg-purple-50' },
  bedtime: { label: '취침 전', icon: Moon,   color: 'text-blue-500',   bg: 'bg-blue-50' },
}

type ScheduleWithMed = Schedule & { medication: Pick<Medication, 'item_name' | 'entp_name' | 'image_url'> | null }

export default function ScheduleList({ schedules: initial }: { schedules: ScheduleWithMed[] }) {
  const supabase = createClient()
  const [schedules, setSchedules] = useState(initial)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('schedules').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
      toast.success(current ? '일정을 중단했습니다' : '일정을 재개했습니다')
    } else {
      toast.error('일정 변경에 실패했습니다.')
    }
  }

  const confirmDelete = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (!error) {
      setSchedules(prev => prev.filter(s => s.id !== id))
      toast.success('복약 일정을 삭제했습니다')
    } else {
      toast.error('삭제에 실패했습니다.')
    }
    setPendingDeleteId(null)
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-mint-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl" role="img" aria-label="약">💊</span>
        </div>
        <p className="font-semibold text-sage-700 mb-1">등록된 복약 일정이 없습니다</p>
        <p className="text-sm text-sage-400 mb-6">약 추가 버튼을 눌러 시작하세요</p>
        <Link
          href="/schedule/new"
          className="inline-flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors shadow-md shadow-mint-500/20"
        >
          <CalendarPlus className="w-4 h-4" /> 첫 일정 등록
        </Link>
      </div>
    )
  }

  const active = schedules.filter(s => s.is_active)
  const inactive = schedules.filter(s => !s.is_active)

  const renderCard = (s: ScheduleWithMed) => (
    <div
      key={s.id}
      className={clsx(
        'bg-white rounded-3xl border shadow-sm p-5 transition-all duration-200',
        s.is_active ? 'border-sage-100' : 'border-sage-100 opacity-55'
      )}
    >
      <div className="flex items-start gap-4">
        {/* 약 아이콘 */}
        <div className={clsx(
          'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden',
          s.is_active ? 'bg-mint-50' : 'bg-sage-100'
        )}>
          {s.medication?.image_url
            ? <img src={s.medication.image_url} alt={s.medication.item_name ?? ''} className="w-full h-full object-cover" />
            : <span className="text-xl">💊</span>
          }
        </div>

        {/* 약 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-sage-900 truncate">{s.medication?.item_name ?? '알 수 없는 약'}</p>
              {s.medication?.entp_name && (
                <p className="text-xs text-sage-400 mt-0.5">{s.medication.entp_name}</p>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleActive(s.id, s.is_active)}
                aria-label={s.is_active ? '일정 중단' : '일정 재개'}
                className={clsx(
                  'p-2 rounded-xl transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center',
                  s.is_active
                    ? 'text-mint-500 hover:bg-mint-50'
                    : 'text-sage-400 hover:bg-sage-50'
                )}
              >
                <Power className="w-4 h-4" aria-hidden />
              </button>

              {pendingDeleteId === s.id ? (
                <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-xl px-2 py-1">
                  <span className="text-xs text-red-600 font-medium whitespace-nowrap">삭제할까요?</span>
                  <button
                    onClick={() => confirmDelete(s.id)}
                    className="p-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden />
                  </button>
                  <button
                    onClick={() => setPendingDeleteId(null)}
                    className="p-1 rounded-lg text-sage-400 hover:bg-sage-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingDeleteId(s.id)}
                  aria-label="삭제"
                  className="p-2 rounded-xl hover:bg-red-50 text-sage-300 hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* 시간대 배지 */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {s.time_slots.map((slot: TimeSlot) => {
              const { label, icon: Icon, color, bg } = SLOT_LABELS[slot]
              return (
                <span key={slot} className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', bg, color)}>
                  <Icon className="w-3 h-3" aria-hidden /> {label}
                </span>
              )
            })}
          </div>

          {/* 기간 + 용량 */}
          <p className="text-xs text-sage-400 mt-2">
            {s.start_date} {s.end_date ? `~ ${s.end_date}` : '~ 계속'}
            {s.dosage && <span className="ml-2 text-sage-500 font-medium">{s.dosage}</span>}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-sage-400 tracking-widest uppercase px-1">복용 중 ({active.length})</p>
          {active.map(renderCard)}
        </div>
      )}
      {inactive.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-sage-400 tracking-widest uppercase px-1">중단됨 ({inactive.length})</p>
          {inactive.map(renderCard)}
        </div>
      )}
    </div>
  )
}
