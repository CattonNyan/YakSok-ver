'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Check, Sun, Sunset, Moon, Coffee, CalendarPlus, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule, MedicationLog, TimeSlot } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const TIME_SLOTS: { slot: TimeSlot; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { slot: 'morning', label: '아침',    icon: Sun,     color: 'text-amber-500',  bg: 'bg-amber-50' },
  { slot: 'lunch',   label: '점심',    icon: Coffee,  color: 'text-orange-500', bg: 'bg-orange-50' },
  { slot: 'dinner',  label: '저녁',    icon: Sunset,  color: 'text-purple-500', bg: 'bg-purple-50' },
  { slot: 'bedtime', label: '취침 전', icon: Moon,    color: 'text-blue-500',   bg: 'bg-blue-50' },
]

type MedicationInfo = { item_name: string; entp_name?: string }

interface Props {
  schedules: (Schedule & { medication: MedicationInfo | null })[]
  logs: MedicationLog[]
  userName: string
  today: string
  userId: string
}

function getMedication(s: Props['schedules'][number]): MedicationInfo | null {
  return s.medication ?? null
}

export default function DashboardClient({ schedules, logs: initialLogs, userName, today, userId }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [isPending, startTransition] = useTransition()
  const supabase = useMemo(() => createClient(), [])

  const logMap = useMemo(() => {
    const map = new Map<string, MedicationLog>()
    for (const l of logs) map.set(`${l.schedule_id}_${l.time_slot}`, l)
    return map
  }, [logs])

  const isLogTaken = useCallback(
    (scheduleId: string, slot: TimeSlot) => logMap.get(`${scheduleId}_${slot}`)?.taken ?? false,
    [logMap]
  )

  const toggleLog = (scheduleId: string, medicationId: string, slot: TimeSlot) => {
    startTransition(async () => {
      const existing = logMap.get(`${scheduleId}_${slot}`)
      if (existing) {
        const newTaken = !existing.taken
        setLogs(prev => prev.map(l => l.id === existing.id ? { ...l, taken: newTaken } : l))
        const { error } = await supabase
          .from('medication_logs')
          .update({ taken: newTaken, taken_at: newTaken ? new Date().toISOString() : null })
          .eq('id', existing.id)
        if (error) {
          setLogs(prev => prev.map(l => l.id === existing.id ? { ...l, taken: !newTaken } : l))
          toast.error('복약 상태 변경에 실패했습니다.')
        } else {
          toast.success(newTaken ? '복약 완료!' : '복약 취소')
        }
      } else {
        const tempId = `temp_${scheduleId}_${slot}`
        const optimisticLog: MedicationLog = {
          id: tempId, user_id: userId, schedule_id: scheduleId, medication_id: medicationId,
          log_date: today, time_slot: slot, taken: true, taken_at: new Date().toISOString(),
        }
        setLogs(prev => [...prev, optimisticLog])
        const { data, error } = await supabase
          .from('medication_logs')
          .insert({ user_id: userId, schedule_id: scheduleId, medication_id: medicationId,
            log_date: today, time_slot: slot, taken: true, taken_at: new Date().toISOString() })
          .select('id,user_id,schedule_id,medication_id,log_date,time_slot,taken,taken_at')
          .single()
        if (error) {
          setLogs(prev => prev.filter(l => l.id !== tempId))
          toast.error('복약 기록에 실패했습니다.')
        } else if (data) {
          setLogs(prev => prev.map(l => l.id === tempId ? data : l))
          toast.success('복약 완료!')
        }
      }
    })
  }

  const totalDoses = schedules.reduce((sum, s) => sum + s.time_slots.length, 0)
  const takenDoses = logs.filter(l => l.taken).length
  const rate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0
  const dateLabel = format(new Date(), 'M월 d일 EEEE', { locale: ko })

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-sage-400 mb-1">{dateLabel}</p>
          <h1 className="text-3xl font-bold text-sage-900 tracking-tight">
            {userName ? `${userName}님,` : ''} 안녕하세요 👋
          </h1>
        </div>
        {totalDoses > 0 && (
          <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-sage-100 shadow-sm flex-shrink-0">
            <span className={cn('w-2 h-2 rounded-full', rate === 100 ? 'bg-mint-500' : 'bg-amber-400')} />
            <span className="text-sm font-semibold text-sage-700">{takenDoses}/{totalDoses} 완료</span>
          </div>
        )}
      </div>

      {/* ── 진행률 카드 ── */}
      {totalDoses > 0 && (
        <div className="bg-gradient-to-br from-mint-500 via-mint-600 to-mint-700 rounded-3xl p-7 text-white shadow-xl shadow-mint-500/20">
          <p className="text-mint-100 text-sm font-medium mb-3">오늘의 복약 완료율</p>
          <div className="flex items-end justify-between mb-5">
            <span className="text-6xl font-bold tracking-tight leading-none">{rate}%</span>
            <span className="text-mint-200 text-sm mb-1">{takenDoses}회 / {totalDoses}회</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${rate}%` }}
            />
          </div>
          {rate === 100 && (
            <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-sm font-semibold">
              🎉 오늘 모든 약을 복용했습니다!
            </div>
          )}
        </div>
      )}

      {/* ── 빈 상태 ── */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-3xl border border-sage-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-mint-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl" role="img" aria-label="약">💊</span>
          </div>
          <p className="font-semibold text-sage-700 mb-1">오늘 복용할 약이 없습니다</p>
          <p className="text-sage-400 text-sm mb-6">복약 일정을 등록하고 관리를 시작해보세요</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/schedule/new"
              className="inline-flex items-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold px-5 py-2.5 rounded-2xl text-sm transition-colors shadow-md shadow-mint-500/20"
            >
              <CalendarPlus className="w-4 h-4" />
              일정 추가
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-white hover:bg-sage-50 text-sage-700 font-semibold px-5 py-2.5 rounded-2xl text-sm border border-sage-200 transition-colors"
            >
              <Search className="w-4 h-4" />
              약 검색
            </Link>
          </div>
        </div>
      ) : (
        /* ── 시간대별 복약 카드 ── */
        TIME_SLOTS.map(({ slot, label, icon: Icon, color, bg }) => {
          const slotSchedules = schedules.filter(s => s.time_slots.includes(slot))
          if (slotSchedules.length === 0) return null

          const takenCount = slotSchedules.filter(s => isLogTaken(s.id, slot)).length
          const allTaken = takenCount === slotSchedules.length

          return (
            <div
              key={slot}
              className="bg-white rounded-3xl border border-sage-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {/* 슬롯 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-sage-50">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-4.5 h-4.5', color)} aria-hidden />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sage-900">{label}</span>
                    <span className="text-xs text-sage-400 bg-sage-50 px-2 py-0.5 rounded-full">{slotSchedules.length}종</span>
                  </div>
                </div>

                {allTaken ? (
                  <span className="text-xs font-semibold text-mint-600 bg-mint-50 border border-mint-100 px-3 py-1 rounded-full">
                    ✓ 모두 완료
                  </span>
                ) : (
                  <span className="text-xs text-sage-400 font-medium">
                    {takenCount}/{slotSchedules.length} 완료
                  </span>
                )}
              </div>

              {/* 약 목록 */}
              <div className="p-4 space-y-2.5">
                {slotSchedules.map(s => {
                  const taken = isLogTaken(s.id, slot)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleLog(s.id, s.medication_id, slot)}
                      disabled={isPending}
                      aria-label={`${getMedication(s)?.item_name} ${taken ? '복약 완료 — 취소하려면 탭하세요' : '복약하기'}`}
                      aria-pressed={taken}
                      className={cn(
                        'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left group',
                        taken
                          ? 'border-mint-200 bg-mint-50/60'
                          : 'border-transparent bg-sage-50 hover:bg-sage-100 hover:border-sage-200'
                      )}
                    >
                      {/* 체크 원 */}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        taken
                          ? 'border-mint-500 bg-mint-500'
                          : 'border-sage-300 bg-white group-hover:border-mint-400'
                      )}>
                        {taken && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} aria-hidden />}
                      </div>

                      {/* 약 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-semibold text-sm truncate transition-all',
                          taken ? 'text-mint-600 line-through decoration-mint-300' : 'text-sage-800'
                        )}>
                          {getMedication(s)?.item_name}
                        </p>
                        {s.dosage && (
                          <p className="text-xs text-sage-400 mt-0.5">{s.dosage}</p>
                        )}
                      </div>

                      {/* 상태 레이블 */}
                      <span className={cn(
                        'text-xs font-semibold flex-shrink-0 transition-colors',
                        taken ? 'text-mint-500' : 'text-sage-300 group-hover:text-sage-400'
                      )}>
                        {taken ? '완료' : '미복용'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* ── 빠른 액션 ── */}
      {schedules.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            href="/schedule/new"
            className="flex items-center gap-3 bg-white hover:bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3.5 transition-colors group shadow-sm"
          >
            <div className="w-8 h-8 bg-mint-50 rounded-xl flex items-center justify-center group-hover:bg-mint-100 transition-colors">
              <CalendarPlus className="w-4 h-4 text-mint-600" aria-hidden />
            </div>
            <span className="text-sm font-semibold text-sage-700">일정 추가</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 bg-white hover:bg-sage-50 border border-sage-100 rounded-2xl px-4 py-3.5 transition-colors group shadow-sm"
          >
            <div className="w-8 h-8 bg-sage-50 rounded-xl flex items-center justify-center group-hover:bg-sage-100 transition-colors">
              <Search className="w-4 h-4 text-sage-500" aria-hidden />
            </div>
            <span className="text-sm font-semibold text-sage-700">약 검색</span>
          </Link>
        </div>
      )}
    </div>
  )
}
