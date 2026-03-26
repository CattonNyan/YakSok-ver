'use client'
import { useRouter } from 'next/navigation'
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  dateMap: Record<string, { total: number; taken: number }>
  currentMonth: string
}

export default function CalendarClient({ dateMap, currentMonth }: Props) {
  const router = useRouter()
  const monthDate = new Date(currentMonth + '-01')
  const daysInMonth = getDaysInMonth(monthDate)
  const firstDayOfWeek = getDay(startOfMonth(monthDate))

  const prevMonth = format(subMonths(monthDate, 1), 'yyyy-MM')
  const nextMonth = format(addMonths(monthDate, 1), 'yyyy-MM')

  const monthLabel = format(monthDate, 'yyyy년 M월', { locale: ko })

  const totalTaken = Object.values(dateMap).reduce((s, d) => s + d.taken, 0)
  const totalDoses = Object.values(dateMap).reduce((s, d) => s + d.total, 0)
  const monthRate = totalDoses > 0 ? Math.round((totalTaken / totalDoses) * 100) : 0

  const getDayColor = (date: string) => {
    const d = dateMap[date]
    if (!d || d.total === 0) return null
    const rate = d.taken / d.total
    if (rate === 1) return 'bg-mint-400'
    if (rate >= 0.5) return 'bg-amber-300'
    return 'bg-red-300'
  }

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">복약 달력</h1>
        <p className="text-sm text-sage-500 mt-1">월별 복약 이행률을 확인하세요</p>
      </div>

      {/* 이번 달 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-mint-600">{monthRate}%</p>
          <p className="text-xs text-sage-500 mt-1">이행률</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-sage-700">{totalTaken}</p>
          <p className="text-xs text-sage-500 mt-1">복약 완료</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-sage-400">{totalDoses - totalTaken}</p>
          <p className="text-xs text-sage-500 mt-1">미완료</p>
        </div>
      </div>

      {/* 달력 */}
      <div className="card">
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push(`/calendar?month=${prevMonth}`)}
            className="p-2 hover:bg-sage-50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-sage-600" />
          </button>
          <h2 className="font-semibold text-sage-800">{monthLabel}</h2>
          <button onClick={() => router.push(`/calendar?month=${nextMonth}`)}
            className="p-2 hover:bg-sage-50 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-sage-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d, i) => (
            <div key={d} className={clsx('text-center text-xs font-medium py-1',
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-sage-400'
            )}>{d}</div>
          ))}
        </div>

        {/* 날짜 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`
            const dotColor = getDayColor(dateStr)
            const today = format(new Date(), 'yyyy-MM-dd') === dateStr
            const dayOfWeek = (firstDayOfWeek + i) % 7

            return (
              <div key={day} className={clsx(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors',
                today ? 'ring-2 ring-mint-400' : '',
              )}>
                <span className={clsx(
                  'text-xs font-medium',
                  dayOfWeek === 0 ? 'text-red-400' : dayOfWeek === 6 ? 'text-blue-400' : 'text-sage-700'
                )}>{day}</span>
                {dotColor && (
                  <div className={clsx('w-5 h-1.5 rounded-full mt-0.5', dotColor)} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-5 text-xs text-sage-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1.5 bg-mint-400 rounded-full" /> 100% 완료
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1.5 bg-amber-300 rounded-full" /> 50% 이상
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1.5 bg-red-300 rounded-full" /> 50% 미만
        </div>
      </div>
    </div>
  )
}
