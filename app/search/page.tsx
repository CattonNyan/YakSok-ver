'use client'
import { useState, useRef } from 'react'
import { Search, Camera, Upload, Loader2, X, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import MedicationCard from '@/components/medicine/MedicationCard'
import type { Medication } from '@/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mode, setMode] = useState<'text' | 'image'>('text')
  const fileRef = useRef<HTMLInputElement>(null)

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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-sage-900">약 검색</h1>
        <p className="text-sm text-sage-500 mt-1">약품명 또는 사진으로 의약품 정보를 확인하세요</p>
      </div>

      {/* 모드 탭 */}
      <div className="flex gap-2 p-1 bg-sage-100 rounded-xl w-fit">
        {(['text', 'image'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-white text-sage-900 shadow-sm' : 'text-sage-500 hover:text-sage-700'
            }`}>
            {m === 'text' ? '🔤 텍스트 검색' : '📷 이미지 검색'}
          </button>
        ))}
      </div>

      {/* 텍스트 검색 */}
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

      {/* 이미지 검색 */}
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

      {/* 검색 결과 */}
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
