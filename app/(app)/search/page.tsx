'use client'
import { useState, useRef } from 'react'
import { Search, Camera, Upload, Loader2, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import MedicationCard from '@/components/medicine/MedicationCard'
import type { Medication } from '@/types'

const SHAPES = ['원형', '타원형', '장방형', '반원형', '삼각형', '사각형', '마름모형', '오각형', '육각형', '팔각형', '기타']
const FORM_CODES = ['정제', '필름코팅정', '경질캡슐제', '연질캡슐제', '장용성필름코팅정', '서방성필름코팅정', '츄어블정', '구강붕해정', '발포정']
const COLORS: { label: string; value: string; hex: string }[] = [
  { label: '하양', value: '하양', hex: '#FFFFFF' },
  { label: '노랑', value: '노랑', hex: '#FFD700' },
  { label: '주황', value: '주황', hex: '#FFA500' },
  { label: '분홍', value: '분홍', hex: '#FFB6C1' },
  { label: '빨강', value: '빨강', hex: '#E53E3E' },
  { label: '갈색', value: '갈색', hex: '#8B4513' },
  { label: '연두', value: '연두', hex: '#90EE90' },
  { label: '초록', value: '초록', hex: '#228B22' },
  { label: '청록', value: '청록', hex: '#20B2AA' },
  { label: '파랑', value: '파랑', hex: '#4169E1' },
  { label: '자주', value: '자주', hex: '#9370DB' },
  { label: '회색', value: '회색', hex: '#808080' },
  { label: '검정', value: '검정', hex: '#1A1A1A' },
  { label: '투명', value: '투명', hex: 'transparent' },
]

function ColorPicker({
  selected,
  onChange,
}: {
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map(({ label, value, hex }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(selected === value ? '' : value)}
          title={label}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border-2 transition-all ${
            selected === value
              ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
              : 'border-sage-200 text-sage-600 hover:border-sage-300'
          }`}
        >
          <span
            className="w-4 h-4 rounded-full border border-sage-200 shrink-0"
            style={{
              background:
                hex === 'transparent'
                  ? 'linear-gradient(135deg, #fff 45%, #e2e8f0 45%)'
                  : hex,
            }}
          />
          {label}
        </button>
      ))}
    </div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mode, setMode] = useState<'text' | 'image' | 'shape'>('text')
  const fileRef = useRef<HTMLInputElement>(null)

  const [selectedShape, setSelectedShape] = useState('')
  const [selectedColor1, setSelectedColor1] = useState('')
  const [selectedColor2, setSelectedColor2] = useState('')
  const [markText, setMarkText] = useState('')
  const [selectedForm, setSelectedForm] = useState('')

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults([])
    try {
      const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.items ?? [])
      if (!data.items?.length) toast('검색 결과가 없습니다', { icon: '🔍' })
    } catch {
      toast.error('검색 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('5MB 이하 이미지만 업로드 가능합니다')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleShapeSearch = async () => {
    if (!selectedShape && !selectedColor1 && !selectedColor2 && !markText.trim() && !selectedForm) {
      toast('모양, 색상, 제형 중 하나 이상 선택해주세요', { icon: '💊' })
      return
    }
    setLoading(true)
    setResults([])
    try {
      const params = new URLSearchParams()
      if (selectedShape)    params.set('drug_shape', selectedShape)
      if (selectedColor1)   params.set('color_class1', selectedColor1)
      if (selectedColor2)   params.set('color_class2', selectedColor2)
      if (markText.trim())  params.set('mark_text', markText.trim())
      if (selectedForm)     params.set('form_code', selectedForm)
      const res = await fetch(`/api/medications/shape-search?${params}`)
      const data = await res.json()
      setResults(data.items ?? [])
      if (!data.items?.length) toast('조건에 맞는 약을 찾지 못했습니다', { icon: '🔍' })
    } catch {
      toast.error('검색 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const handleImageSearch = async () => {
    if (!imagePreview) return
    setLoading(true)
    setResults([])
    try {
      const res = await fetch('/api/medications/image-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview }),
      })
      const data = await res.json()
      setResults(data.candidates ?? [])
      if (!data.candidates?.length) toast('이미지에서 약을 인식하지 못했습니다', { icon: '📷' })
    } catch {
      toast.error('이미지 분석 중 오류가 발생했습니다')
    }
    setLoading(false)
  }

  const hasShapeFilter = selectedShape || selectedColor1 || selectedColor2 || markText || selectedForm
  const resetShapeFilter = () => {
    setSelectedShape('')
    setSelectedColor1('')
    setSelectedColor2('')
    setMarkText('')
    setSelectedForm('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">약 검색</h1>
        <p className="text-sm text-sage-500 mt-1">약품명 또는 사진으로 의약품 정보를 확인하세요</p>
      </div>

      <div className="flex gap-1 p-1 bg-sage-100 rounded-xl w-fit">
        {([
          { key: 'text',  label: '🔤 이름 검색' },
          { key: 'shape', label: '💊 모양 검색' },
          { key: 'image', label: '📷 사진 검색' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => { setMode(key); setResults([]) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === key ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'text' && (
        <form onSubmit={handleTextSearch} className="flex gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="약품명 입력 (예: 타이레놀, 아스피린)"
            className="input-base flex-1" />
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 whitespace-nowrap">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            검색
          </button>
        </form>
      )}

      {mode === 'shape' && (
        <div className="card space-y-5">
          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">알약 모양</p>
            <div className="flex flex-wrap gap-2">
              {SHAPES.map(shape => (
                <button key={shape} type="button"
                  onClick={() => setSelectedShape(prev => prev === shape ? '' : shape)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                    selectedShape === shape
                      ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
                      : 'border-sage-200 text-sage-600 hover:border-sage-300'
                  }`}>
                  {shape}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1">색상 1</p>
            <p className="text-xs text-sage-400 mb-3">주 색상을 선택하세요</p>
            <ColorPicker selected={selectedColor1} onChange={setSelectedColor1} />
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1">
              색상 2 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </p>
            <p className="text-xs text-sage-400 mb-3">투톤 색상이면 두 번째 색도 선택하세요</p>
            <ColorPicker selected={selectedColor2} onChange={setSelectedColor2} />
          </div>

          <div>
            <p className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-3">
              제형 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {FORM_CODES.map(form => (
                <button key={form} type="button"
                  onClick={() => setSelectedForm(prev => prev === form ? '' : form)}
                  className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                    selectedForm === form
                      ? 'border-mint-400 bg-mint-50 text-mint-700 font-medium'
                      : 'border-sage-200 text-sage-600 hover:border-sage-300'
                  }`}>
                  {form}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-sage-500 uppercase tracking-wide mb-1 block">
              각인 · 인쇄 문자 <span className="font-normal normal-case text-sage-400">(선택)</span>
            </label>
            <p className="text-xs text-sage-400 mb-2">알약에 새겨진 문자나 숫자를 입력하세요</p>
            <input
              type="text"
              value={markText}
              onChange={e => setMarkText(e.target.value)}
              placeholder="예: 500, TY, DW"
              className="input-base w-full"
            />
          </div>

          {hasShapeFilter && (
            <button type="button" onClick={resetShapeFilter}
              className="text-xs text-sage-400 hover:text-sage-600 flex items-center gap-1">
              <X className="w-3 h-3" /> 선택 초기화
            </button>
          )}

          <button onClick={handleShapeSearch} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            모양으로 검색
          </button>
        </div>
      )}

      {mode === 'image' && (
        <div className="card space-y-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-sage-200 rounded-xl p-8 text-center cursor-pointer hover:border-mint-400 hover:bg-mint-50 transition-all">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="미리보기" className="max-h-48 mx-auto rounded-lg object-contain" />
                <button onClick={e => { e.stopPropagation(); setImagePreview(null) }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <Camera className="w-10 h-10 text-sage-300 mx-auto mb-3" />
                <p className="text-sage-500 font-medium">사진을 업로드하세요</p>
                <p className="text-xs text-sage-400 mt-1">JPG, PNG · 최대 5MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">AI가 후보 약품을 제안하며, 정확도는 100%가 아닐 수 있습니다. 반드시 직접 확인하세요.</p>
          </div>

          <button onClick={handleImageSearch} disabled={!imagePreview || loading}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            AI로 약 찾기
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-mint-500 animate-spin" />
          <p className="text-sage-500 text-sm">{mode === 'image' ? 'AI가 약을 분석하고 있습니다...' : '검색 중...'}</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-sage-500 font-medium">검색 결과 {results.length}개</p>
          {results.map(med => (
            <MedicationCard key={med.id} medication={med} showAddButton />
          ))}
        </div>
      )}
    </div>
  )
}
