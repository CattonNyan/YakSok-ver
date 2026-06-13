'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Check, Sun, Sunset, Moon, Coffee, CalendarPlus, Search, Flame, ChevronDown, Camera } from 'lucide-react'
import { format, parseISO, subDays, startOfWeek, addDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { Schedule, MedicationLog, TimeSlot } from '@/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const TIME_SLOTS: { slot: TimeSlot; label: string; icon: React.ElementType; color: string; bg: string; darkBg: string }[] = [
  { slot: 'morning', label: '아침',    icon: Sun,     color: 'text-amber-500',  bg: 'bg-amber-50',  darkBg: 'dark:bg-amber-900/20' },
  { slot: 'lunch',   label: '점심',    icon: Coffee,  color: 'text-orange-500', bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/20' },
  { slot: 'dinner',  label: '저녁',    icon: Sunset,  color: 'text-purple-500', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20' },
  { slot: 'bedtime', label: '취침 전', icon: Moon,    color: 'text-blue-500',   bg: 'bg-blue-50',   darkBg: 'dark:bg-blue-900/20' },
]

const SLOT_ORDER: Record<TimeSlot, number> = { morning: 0, lunch: 1, dinner: 2, bedtime: 3 }
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function getCurrentSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 16) return 'lunch'
  if (h >= 16 && h < 21) return 'dinner'
  return 'bedtime'
}

type MedicationInfo = { item_name: string; entp_name?: string }
type RecentLog = { log_date: string; taken: boolean }

interface Props {
  schedules: (Schedule & { medication: MedicationInfo | null })[]
  logs: MedicationLog[]
  recentLogs: RecentLog[]
  userName: string
  today: string
  userId: string
}

function getMedication(s: Props['schedules'][number]): MedicationInfo | null {
  return s.medication ?? null
}

const RING_RADIUS = 42
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function DashboardClient({ schedules, logs: initialLogs, recentLogs, userName, today, userId }: Props) {
  const [logs, setLogs] = useState(initialLogs)
  const [expandedSlots, setExpandedSlots] = useState<Set<TimeSlot>>(new Set())
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

  const toggleSlotExpanded = (slot: TimeSlot) => {
    setExpandedSlots(prev => {
      const next = new Set(prev)
      if (next.has(slot)) next.delete(slot)
      else next.add(slot)
      return next
    })
  }

  const totalDoses = schedules.reduce((sum, s) => sum + s.time_slots.length, 0)
  const takenDoses = logs.filter(l => l.taken).length
  const rate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0
  const dateLabel = format(new Date(), 'M월 d일 EEEE', { locale: ko })
  const currentSlot = getCurrentSlot()

  /* 지난 29일 일자별 복약 통계 (오늘 제외) */
  const historyStats = useMemo(() => {
    const map = new Map<string, { taken: number; total: number }>()
    for (const l of recentLogs) {
      const s = map.get(l.log_date) ?? { taken: 0, total: 0 }
      s.total += 1
      if (l.taken) s.taken += 1
      map.set(l.log_date, s)
    }
    return map
  }, [recentLogs])

  const isDayComplete = useCallback((dateStr: string) => {
    if (dateStr === today) return totalDoses > 0 && takenDoses === totalDoses
    const s = historyStats.get(dateStr)
    return !!s && s.total > 0 && s.taken === s.total
  }, [today, totalDoses, takenDoses, historyStats])

  /* 연속 복약 일수 — 오늘이 미완료면 어제부터 거슬러 셈 */
  const streak = useMemo(() => {
    let cursor = parseISO(today)
    if (!isDayComplete(format(cursor, 'yyyy-MM-dd'))) cursor = subDays(cursor, 1)
    let count = 0
    while (isDayComplete(format(cursor, 'yyyy-MM-dd'))) {
      count += 1
      cursor = subDays(cursor, 1)
    }
    return count
  }, [today, isDayComplete])

  /* 이번 주 (월~일) 일자별 달성률 */
  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISO(today), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = format(addDays(start, i), 'yyyy-MM-dd')
      const isToday = dateStr === today
      const future = dateStr > today
      let pct: number | null = null
      if (isToday) pct = totalDoses > 0 ? rate : null
      else if (!future) {
        const s = historyStats.get(dateStr)
        pct = s && s.total > 0 ? Math.round((s.taken / s.total) * 100) : null
      }
      return { label: WEEKDAY_LABELS[i], dateStr, isToday, future, pct }
    })
  }, [today, historyStats, totalDoses, rate])

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── 헤더 ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-sage-400 mb-1">{dateLabel}</p>
          <h1 className="text-3xl font-bold text-sage-900 dark:text-sage-50 tracking-tight">
            {userName ? `${userName}님,` : ''} 안녕하세요 👋
          </h1>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-700/40 rounded-2xl px-3.5 py-2 flex-shrink-0">
            <Flame className="w-4 h-4 text-amber-500" aria-hidden />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{streak}일 연속</span>
          </div>
        )}
      </div>

      {/* ── 진행률 히어로 ── */}
      {totalDoses > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-mint-500 via-mint-600 to-mint-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-mint-500/20">
          <div className="absolute -top-20 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div className="relative flex items-center gap-5 sm:gap-7">
            {/* 진행률 링 */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0" role="img" aria-label={`오늘 복약 완료율 ${rate}%`}>
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="11" />
                <circle
                  cx="50" cy="50" r={RING_RADIUS} fill="none" stroke="white" strokeWidth="11" strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={(1 - rate / 100) * RING_CIRCUMFERENCE}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold leading-none tracking-tight">{rate}%</span>
                <span className="text-[10px] sm:text-xs text-mint-100 mt-1">{takenDoses}/{totalDoses}회</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-mint-100 text-sm font-medium mb-0.5">오늘의 복약</p>
              <p className="text-lg sm:text-xl font-bold mb-4">
                {rate === 100 ? '모두 완료했어요!' : `${totalDoses - takenDoses}회 남았어요`}
              </p>

              {/* 주간 잔디 */}
              <div className="flex items-center gap-2 sm:gap-3">
                {weekDays.map(d => (
                  <div key={d.dateStr} className="flex flex-col items-center gap-1.5">
                    <span className={cn('text-[10px] leading-none', d.isToday ? 'text-white font-bold' : 'text-mint-100/80')}>
                      {d.label}
                    </span>
                    <div
                      className={cn(
                        'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center transition-colors',
                        d.pct === 100
                          ? 'bg-white text-mint-600'
                          : d.pct !== null && d.pct > 0
                            ? 'bg-white/40'
                            : d.future
                              ? 'border border-white/25'
                              : 'bg-white/15',
                        d.isToday && 'ring-2 ring-white/70 ring-offset-2 ring-offset-mint-600'
                      )}
                      title={d.pct !== null ? `${d.label}요일 ${d.pct}% 완료` : undefined}
                    >
                      {d.pct === 100 && <Check className="w-3 h-3" strokeWidth={3.5} aria-hidden />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {rate === 100 && (
            <div className="relative mt-5 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-2.5 text-sm font-semibold animate-celebrate-in">
              🎉 완벽해요! 오늘 모든 약을 복용했습니다
            </div>
          )}
        </div>
      )}

      {/* ── 빈 상태 (온보딩) ── */}
      {schedules.length === 0 ? (
        <div className="bg-white dark:bg-sage-800 rounded-3xl border border-sage-100 dark:border-sage-700 p-8 sm:p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gradient-to-br from-mint-400 to-mint-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-mint-500/25">
            <span className="text-3xl" role="img" aria-label="약">💊</span>
          </div>
          <p className="text-lg font-bold text-sage-800 dark:text-sage-100 mb-1">복약 관리를 시작해보세요</p>
          <p className="text-sage-400 text-sm">세 단계면 충분해요. 등록한 약은 매일 이곳에서 확인할 수 있어요.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-7 text-left">
            {[
              { step: 1, icon: Camera,       title: '약 검색',   desc: '사진 한 장 또는 이름으로 약을 찾아요' },
              { step: 2, icon: CalendarPlus, title: '일정 등록', desc: '아침·점심·저녁 복용 시간을 정해요' },
              { step: 3, icon: Check,        title: '매일 체크', desc: '탭 한 번으로 복약을 기록해요' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative bg-sage-50 dark:bg-sage-700/40 rounded-2xl p-4 pt-5">
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-mint-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {step}
                </span>
                <div className="w-9 h-9 bg-white dark:bg-sage-700 rounded-xl flex items-center justify-center mb-2.5 shadow-sm">
                  <Icon className="w-4.5 h-4.5 text-mint-600 dark:text-mint-400" aria-hidden />
                </div>
                <p className="font-semibold text-sm text-sage-800 dark:text-sage-100 mb-0.5">{title}</p>
                <p className="text-xs text-sage-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

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
              className="inline-flex items-center gap-2 bg-white dark:bg-sage-700 hover:bg-sage-50 dark:hover:bg-sage-600 text-sage-700 dark:text-sage-200 font-semibold px-5 py-2.5 rounded-2xl text-sm border border-sage-200 dark:border-sage-600 transition-colors"
            >
              <Search className="w-4 h-4" />
              약 검색
            </Link>
          </div>
        </div>
      ) : (
        /* ── 시간대별 복약 카드 ── */
        TIME_SLOTS.map(({ slot, label, icon: Icon, color, bg, darkBg }) => {
          const slotSchedules = schedules.filter(s => s.time_slots.includes(slot))
          if (slotSchedules.length === 0) return null

          const takenCount = slotSchedules.filter(s => isLogTaken(s.id, slot)).length
          const allTaken = takenCount === slotSchedules.length
          const isCurrent = slot === currentSlot
          const isPast = SLOT_ORDER[slot] < SLOT_ORDER[currentSlot]
          const collapsed = isPast && allTaken && !expandedSlots.has(slot)

          /* 지나간 시간대 + 모두 복용 완료 → 한 줄로 접기 */
          if (collapsed) {
            return (
              <button
                key={slot}
                onClick={() => toggleSlotExpanded(slot)}
                aria-expanded={false}
                className="w-full flex items-center justify-between bg-white dark:bg-sage-800 rounded-3xl border border-sage-100 dark:border-sage-700 px-6 py-3.5 shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', bg, darkBg)}>
                    <Icon className={cn('w-4 h-4', color)} aria-hidden />
                  </div>
                  <span className="font-bold text-sm text-sage-500 dark:text-sage-400">{label}</span>
                  <span className="text-xs font-semibold text-mint-600 dark:text-mint-400">✓ {slotSchedules.length}종 모두 완료</span>
                </div>
                <ChevronDown className="w-4 h-4 text-sage-300 dark:text-sage-500 group-hover:text-sage-400 transition-colors" aria-hidden />
              </button>
            )
          }

          return (
            <div
              key={slot}
              className={cn(
                'bg-white dark:bg-sage-800 rounded-3xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200',
                isCurrent
                  ? 'border-mint-200 dark:border-mint-700/60 ring-2 ring-mint-400/40 dark:ring-mint-500/30 shadow-lg shadow-mint-500/10'
                  : 'border-sage-100 dark:border-sage-700'
              )}
            >
              {/* 슬롯 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-sage-50 dark:border-sage-700">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center', bg, darkBg)}>
                    <Icon className={cn('w-4.5 h-4.5', color)} aria-hidden />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sage-900 dark:text-sage-50">{label}</span>
                    <span className="text-xs text-sage-400 bg-sage-50 dark:bg-sage-700 dark:text-sage-300 px-2 py-0.5 rounded-full">{slotSchedules.length}종</span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-mint-600 dark:text-mint-400 bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 px-2.5 py-0.5 rounded-full">
                        <span className="relative flex w-1.5 h-1.5" aria-hidden>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75" />
                          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-mint-500" />
                        </span>
                        지금
                      </span>
                    )}
                  </div>
                </div>

                {allTaken ? (
                  <span className="text-xs font-semibold text-mint-600 bg-mint-50 dark:bg-mint-900/20 dark:text-mint-400 border border-mint-100 dark:border-mint-800 px-3 py-1 rounded-full">
                    ✓ 모두 완료
                  </span>
                ) : isCurrent ? (
                  <span className="text-xs font-bold text-mint-600 dark:text-mint-400">
                    {slotSchedules.length - takenCount}개 남음
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
                        'w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left group active:scale-[0.99]',
                        taken
                          ? 'border-mint-200 dark:border-mint-700 bg-mint-50/60 dark:bg-mint-900/20'
                          : 'border-transparent bg-sage-50 dark:bg-sage-700/50 hover:bg-sage-100 dark:hover:bg-sage-700 hover:border-sage-200 dark:hover:border-sage-600'
                      )}
                    >
                      {/* 체크 원 */}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
                        taken
                          ? 'border-mint-500 bg-mint-500'
                          : 'border-sage-300 dark:border-sage-500 bg-white dark:bg-sage-700 group-hover:border-mint-400'
                      )}>
                        {taken && <Check className="w-3.5 h-3.5 text-white animate-check-pop" strokeWidth={3} aria-hidden />}
                      </div>

                      {/* 약 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-semibold text-sm truncate transition-all',
                          taken ? 'text-mint-600 dark:text-mint-400 line-through decoration-mint-300' : 'text-sage-800 dark:text-sage-100'
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
                        taken ? 'text-mint-500 dark:text-mint-400' : 'text-sage-300 dark:text-sage-500 group-hover:text-sage-400'
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
            className="flex items-center gap-3 bg-white dark:bg-sage-800 hover:bg-sage-50 dark:hover:bg-sage-700 border border-sage-100 dark:border-sage-700 rounded-2xl px-4 py-3.5 transition-colors group shadow-sm"
          >
            <div className="w-8 h-8 bg-mint-50 dark:bg-mint-900/20 rounded-xl flex items-center justify-center group-hover:bg-mint-100 dark:group-hover:bg-mint-900/30 transition-colors">
              <CalendarPlus className="w-4 h-4 text-mint-600 dark:text-mint-400" aria-hidden />
            </div>
            <span className="text-sm font-semibold text-sage-700 dark:text-sage-200">일정 추가</span>
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-3 bg-white dark:bg-sage-800 hover:bg-sage-50 dark:hover:bg-sage-700 border border-sage-100 dark:border-sage-700 rounded-2xl px-4 py-3.5 transition-colors group shadow-sm"
          >
            <div className="w-8 h-8 bg-sage-50 dark:bg-sage-700 rounded-xl flex items-center justify-center group-hover:bg-sage-100 dark:group-hover:bg-sage-600 transition-colors">
              <Search className="w-4 h-4 text-sage-500 dark:text-sage-400" aria-hidden />
            </div>
            <span className="text-sm font-semibold text-sage-700 dark:text-sage-200">약 검색</span>
          </Link>
        </div>
      )}
    </div>
  )
}
