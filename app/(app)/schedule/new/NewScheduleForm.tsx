'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { ArrowLeft, Loader2, Sun, Coffee, Moon, Bed, Check, CalendarDays, FileText, Clock } from 'lucide-react'
import DatePicker from '@/components/ui/DatePicker'
import type { TimeSlot, Medication } from '@/types'
import Link from 'next/link'

const TIME_SLOTS: { value: TimeSlot; label: string; icon: React.ElementType; sub: string; color: string; bg: string }[] = [
  { value: 'morning', label: '아침',    icon: Sun,    sub: '기상 후',  color: 'text-amber-500',  bg: 'bg-amber-50' },
  { value: 'lunch',   label: '점심',    icon: Coffee, sub: '식사 후',  color: 'text-orange-500', bg: 'bg-orange-50' },
  { value: 'dinner',  label: '저녁',    icon: Moon,   sub: '식사 후',  color: 'text-purple-500', bg: 'bg-purple-50' },
  { value: 'bedtime', label: '취침 전', icon: Bed,    sub: '자기 전',  color: 'text-blue-500',   bg: 'bg-blue-50' },
]

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 bg-mint-50 rounded-xl flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-mint-600" />
        </div>
        <p className="text-sm font-bold text-sage-800">{title}</p>
      </div>
      {children}
    </div>
  )
}

export default function NewScheduleForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const medId = searchParams.get('med')

  const [medication, setMedication] = useState<Medication | null>(null)
  const [loadingMed, setLoadingMed] = useState(!!medId)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(['morning'])
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [endDate, setEndDate] = useState<string>('')
  const [useEndDate, setUseEndDate] = useState(false)
  const [dosage, setDosage] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!medId) return
    const supabase = createClient()
    supabase
      .from('medications')
      .select('id,item_name,entp_name,image_url,class_name')
      .eq('id', medId)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error('약물 정보를 불러올 수 없습니다')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        else if (data) setMedication(data as any)
        setLoadingMed(false)
      })
  }, [medId])

  const toggleSlot = (slot: TimeSlot) => {
    setTimeSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medication) { toast.error('약을 선택해주세요'); return }
    if (timeSlots.length === 0) { toast.error('복용 시간대를 하나 이상 선택해주세요'); return }
    if (useEndDate && !endDate) { toast.error('종료일을 선택해주세요'); return }
    if (useEndDate && endDate < startDate) { toast.error('종료일은 시작일 이후여야 합니다'); return }

    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('로그인이 필요합니다'); setSaving(false); return }

    await supabase.from('profiles').upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { error } = await supabase.from('schedules').insert({
      user_id: user.id,
      medication_id: medication.id,
      time_slots: timeSlots,
      start_date: startDate,
      end_date: useEndDate && endDate ? endDate : null,
      dosage: dosage.trim() || null,
      memo: memo.trim() || null,
      is_active: true,
    })

    if (error) { toast.error('저장에 실패했습니다: ' + error.message); setSaving(false); return }

    toast.success('복약 일정이 등록됐습니다!')
    router.refresh()
    router.push('/schedule')
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/schedule" className="w-9 h-9 rounded-xl bg-white border border-sage-100 shadow-sm flex items-center justify-center hover:bg-sage-50 transition-colors">
          <ArrowLeft className="w-4 h-4 text-sage-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-sage-900 tracking-tight">약 추가</h1>
          <p className="text-sm text-sage-400 mt-0.5">복약 일정을 등록하세요</p>
        </div>
      </div>

      {/* 선택된 약 */}
      <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-6">
        <p className="text-xs font-bold text-sage-400 tracking-widest uppercase mb-4">선택된 약</p>
        {loadingMed ? (
          <div className="flex items-center gap-2 text-sage-400">
            <Loader2 className="w-4 h-4 animate-spin" /> 불러오는 중...
          </div>
        ) : medication ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-mint-50 flex items-center justify-center shrink-0 overflow-hidden">
              {medication.image_url
                ? <img src={medication.image_url} alt={medication.item_name} className="w-full h-full object-cover" />
                : <span className="text-2xl">💊</span>}
            </div>
            <div>
              <p className="font-bold text-sage-900">{medication.item_name}</p>
              {medication.entp_name && <p className="text-xs text-sage-400 mt-0.5">{medication.entp_name}</p>}
              {medication.class_name && (
                <span className="inline-block mt-1.5 text-xs bg-mint-50 text-mint-700 border border-mint-100 px-2.5 py-0.5 rounded-full font-medium">
                  {medication.class_name}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sage-400 text-sm mb-2">약이 선택되지 않았습니다</p>
            <Link href="/search" className="text-sm font-semibold text-mint-600 hover:text-mint-700">
              약 검색하러 가기 →
            </Link>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 복용 시간대 */}
        <SectionCard icon={Clock} title="복용 시간대">
          <div className="grid grid-cols-2 gap-2.5">
            {TIME_SLOTS.map(({ value, label, icon: Icon, sub, color, bg }) => {
              const selected = timeSlots.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSlot(value)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                    selected
                      ? 'border-mint-300 bg-mint-50'
                      : 'border-transparent bg-sage-50 hover:bg-sage-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${selected ? 'text-mint-700' : 'text-sage-700'}`}>{label}</p>
                    <p className="text-xs text-sage-400">{sub}</p>
                  </div>
                  {selected && (
                    <div className="w-5 h-5 rounded-full bg-mint-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* 복용량 */}
        <SectionCard icon={FileText} title="복용량 (선택)">
          <input
            type="text"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder="예: 1정, 5mL"
            className="input-base"
          />
        </SectionCard>

        {/* 복용 기간 */}
        <SectionCard icon={CalendarDays} title="복용 기간">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-sage-700 mb-2 block">
                시작일 <span className="text-red-400">*</span>
              </label>
              <DatePicker value={startDate} onChange={v => setStartDate(v)} />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = !useEndDate
                    setUseEndDate(next)
                    if (next && !endDate) setEndDate(startDate)
                  }}
                  className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${useEndDate ? 'bg-mint-500' : 'bg-sage-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useEndDate ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-semibold text-sage-700">종료일 설정</span>
              </label>
              {useEndDate && (
                <DatePicker value={endDate || startDate} onChange={v => setEndDate(v)} />
              )}
            </div>
          </div>
        </SectionCard>

        {/* 메모 */}
        <SectionCard icon={FileText} title="메모 (선택)">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="복용 관련 메모를 입력하세요"
            rows={3}
            className="input-base resize-none"
          />
        </SectionCard>

        <button
          type="submit"
          disabled={saving || !medication || timeSlots.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? '저장 중...' : '복약 일정 등록'}
        </button>
      </form>
    </div>
  )
}
