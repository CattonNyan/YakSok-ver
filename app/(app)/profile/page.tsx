'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2, Camera, Plus, X, User, Activity, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DatePicker from '@/components/ui/DatePicker'
import clsx from 'clsx'

const CONDITIONS = [
  '고혈압', '당뇨', '고지혈증', '심장질환', '신장질환',
  '간질환', '갑상선질환', '천식', '관절염', '골다공증',
]

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-sage-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-sage-50">
        <div className="w-7 h-7 bg-mint-50 rounded-xl flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-mint-600" />
        </div>
        <p className="font-bold text-sage-800 text-sm">{title}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [name, setName]             = useState('')
  const [birthDate, setBirthDate]   = useState('')
  const [gender, setGender]         = useState<'male' | 'female' | 'other' | ''>('')
  const [height, setHeight]         = useState('')
  const [weight, setWeight]         = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [customCondition, setCustomCondition] = useState('')
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null)
  const [email, setEmail]           = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setName(data.name ?? '')
        setBirthDate(data.birth_date ?? '')
        setGender(data.gender ?? '')
        setHeight(data.height?.toString() ?? '')
        setWeight(data.weight?.toString() ?? '')
        setConditions(data.conditions ?? [])
        setAvatarUrl(data.avatar_url ?? null)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('2MB 이하 이미지만 업로드 가능합니다'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      toast.error(uploadError.message.includes('Bucket not found')
        ? '스토리지 버킷이 없습니다.'
        : `사진 업로드 실패: ${uploadError.message}`)
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
    setUploading(false)
    toast.success('사진이 업로드됐습니다')
  }

  const toggleCondition = (c: string) =>
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const addCustomCondition = () => {
    const val = customCondition.trim()
    if (!val || conditions.includes(val)) return
    setConditions(prev => [...prev, val])
    setCustomCondition('')
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('이름을 입력해주세요'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = {
      name: name.trim(), birth_date: birthDate || null, gender: gender || null,
      height: height ? parseFloat(height) : null, weight: weight ? parseFloat(weight) : null,
      conditions, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
    }
    const { data: updated, error } = await supabase.from('profiles').update(payload).eq('id', user.id).select()
    if (error) {
      toast.error(`저장 실패: ${error.message}`)
    } else if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase.from('profiles').insert({ id: user.id, email: user.email ?? '', ...payload })
      if (insertError) toast.error(`저장 실패: ${insertError.message}`)
      else toast.success('프로필이 저장됐습니다!')
    } else {
      toast.success('프로필이 저장됐습니다!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
      </div>
    )
  }

  const customConditions = conditions.filter(c => !CONDITIONS.includes(c))

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-bold text-mint-600 tracking-widest uppercase mb-1">Account</p>
        <h1 className="text-3xl font-bold text-sage-900 tracking-tight">프로필</h1>
        <p className="text-sage-400 mt-1">개인 정보를 관리하세요</p>
      </div>

      {/* 아바타 */}
      <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-8 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-sage-100 overflow-hidden flex items-center justify-center ring-4 ring-sage-50">
            {avatarUrl
              ? <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover" />
              : <User className="w-10 h-10 text-sage-300" />}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-9 h-9 bg-mint-500 hover:bg-mint-600 rounded-2xl flex items-center justify-center text-white transition-colors shadow-md shadow-mint-500/25"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div className="text-center">
          <p className="font-bold text-sage-900">{name || '이름 없음'}</p>
          <p className="text-sm text-sage-400">{email}</p>
        </div>
        <p className="text-xs text-sage-400">JPG, PNG · 최대 2MB</p>
      </div>

      {/* 기본 정보 */}
      <Section icon={User} title="기본 정보">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1.5">이메일</label>
            <input value={email} disabled className="input-base bg-sage-50 text-sage-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1.5">이름 <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-1.5">생년월일</label>
            <DatePicker value={birthDate} onChange={setBirthDate} placeholder="생년월일을 선택하세요" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-sage-700 mb-2">성별</label>
            <div className="flex gap-2">
              {[{ value: 'male', label: '남성' }, { value: 'female', label: '여성' }, { value: 'other', label: '기타' }].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setGender(value as 'male' | 'female' | 'other')}
                  className={clsx(
                    'flex-1 py-2.5 rounded-2xl border-2 text-sm font-semibold transition-all',
                    gender === value
                      ? 'bg-mint-50 border-mint-300 text-mint-700'
                      : 'bg-white border-sage-100 text-sage-500 hover:border-sage-200'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-sage-700 mb-1.5">키 (cm)</label>
              <input type="number" value={height} onChange={e => setHeight(e.target.value)}
                placeholder="170" min="100" max="250" className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-sage-700 mb-1.5">몸무게 (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="65" min="20" max="300" className="input-base" />
            </div>
          </div>
        </div>
      </Section>

      {/* 건강 상태 */}
      <Section icon={Activity} title="건강 상태">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button
                key={c}
                onClick={() => toggleCondition(c)}
                className={clsx(
                  'px-3 py-1.5 rounded-2xl text-sm font-medium border-2 transition-all',
                  conditions.includes(c)
                    ? 'bg-mint-50 border-mint-300 text-mint-700'
                    : 'bg-white border-sage-100 text-sage-500 hover:border-sage-200'
                )}
              >
                {conditions.includes(c) && '✓ '}{c}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={customCondition}
              onChange={e => setCustomCondition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomCondition()}
              placeholder="직접 입력 (예: 편두통)"
              className="input-base flex-1"
            />
            <button
              onClick={addCustomCondition}
              className="px-4 py-2.5 bg-mint-500 hover:bg-mint-600 text-white rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {customConditions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customConditions.map(c => (
                <span key={c} className="inline-flex items-center gap-1.5 bg-sage-100 text-sage-700 text-sm px-3 py-1.5 rounded-2xl font-medium">
                  {c}
                  <button onClick={() => toggleCondition(c)} className="hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* 저장 버튼 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-600 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-mint-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        저장하기
      </button>
    </div>
  )
}
