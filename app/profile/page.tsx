'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Loader2, Camera, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CONDITIONS = [
  '고혈압', '당뇨', '고지혈증', '심장질환', '신장질환',
  '간질환', '갑상선질환', '천식', '관절염', '골다공증',
]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [conditions, setConditions] = useState<string[]>([])
  const [customCondition, setCustomCondition] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

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
    if (file.size > 2 * 1024 * 1024) {
      toast.error('2MB 이하 이미지만 업로드 가능합니다')
      return
    }

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error('사진 업로드에 실패했습니다')
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars').getPublicUrl(path)

    setAvatarUrl(publicUrl)
    setUploading(false)
    toast.success('사진이 업로드됐습니다')
  }

  const toggleCondition = (c: string) => {
    setConditions(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

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

    const { error } = await supabase.from('profiles').update({
      name: name.trim(),
      birth_date:  birthDate || null,
      gender:      gender || null,
      height:      height ? parseFloat(height) : null,
      weight:      weight ? parseFloat(weight) : null,
      conditions:  conditions,
      avatar_url:  avatarUrl,
      updated_at:  new Date().toISOString(),
    }).eq('id', user.id)

    if (error) {
      toast.error('저장에 실패했습니다')
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

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">프로필</h1>
        <p className="text-sm text-sage-500 mt-1">개인 정보를 관리하세요</p>
      </div>

      {/* 프로필 사진 */}
      <div className="card flex flex-col items-center py-6 gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-sage-100 overflow-hidden flex items-center justify-center">
            {avatarUrl
              ? <img src={avatarUrl} alt="프로필" className="w-full h-full object-cover" />
              : <span className="text-4xl">👤</span>}
          </div>
          <button onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 bg-mint-500 rounded-full flex items-center justify-center text-white hover:bg-mint-600 transition-colors">
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Camera className="w-4 h-4" />}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <p className="text-xs text-sage-400">JPG, PNG · 최대 2MB</p>
      </div>

      {/* 기본 정보 */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sage-800">기본 정보</h2>

        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">이메일</label>
          <input value={email} disabled className="input-base bg-sage-50 text-sage-400 cursor-not-allowed" />
        </div>

        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">이름 *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="홍길동" className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-sage-700 mb-1.5">생년월일</label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            className="input-base" />
        </div>

        <div>
          <label className="block text-sm font-medium text-sage-700 mb-2">성별</label>
          <div className="flex gap-2">
            {[
              { value: 'male',   label: '남성' },
              { value: 'female', label: '여성' },
              { value: 'other',  label: '기타' },
            ].map(({ value, label }) => (
              <button key={value} onClick={() => setGender(value as any)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  gender === value
                    ? 'bg-mint-50 border-mint-400 text-mint-700'
                    : 'bg-white border-sage-200 text-sage-600 hover:bg-sage-50'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">키 (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)}
              placeholder="170" min="100" max="250" className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-700 mb-1.5">몸무게 (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="65" min="20" max="300" className="input-base" />
          </div>
        </div>
      </div>

      {/* 질환/건강 상태 */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sage-800">복용 중인 질환 / 건강 상태</h2>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => toggleCondition(c)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                conditions.includes(c)
                  ? 'bg-mint-50 border-mint-400 text-mint-700'
                  : 'bg-white border-sage-200 text-sage-600 hover:bg-sage-50'
              }`}>
              {conditions.includes(c) ? '✓ ' : ''}{c}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="flex gap-2">
          <input value={customCondition} onChange={e => setCustomCondition(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomCondition()}
            placeholder="직접 입력 (예: 편두통)" className="input-base flex-1" />
          <button onClick={addCustomCondition}
            className="btn-primary px-3 flex items-center gap-1">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 직접 입력한 항목 */}
        {conditions.filter(c => !CONDITIONS.includes(c)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {conditions.filter(c => !CONDITIONS.includes(c)).map(c => (
              <span key={c} className="inline-flex items-center gap-1 bg-sage-100 text-sage-700 text-sm px-3 py-1.5 rounded-full">
                {c}
                <button onClick={() => toggleCondition(c)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        저장하기
      </button>
    </div>
  )
}