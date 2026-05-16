'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Medication } from '@/types'

interface Props {
  medication: Medication
  showAddButton?: boolean
}

function Badge({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-sage-50 text-sage-500 px-2.5 py-0.5 rounded-full border border-sage-100">
      <span className="text-sage-400 font-medium">{label}</span> {value}
    </span>
  )
}

export default function MedicationCard({ medication: initialMed, showAddButton }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [medication, setMedication] = useState<Medication>(initialMed)
  const [detailState, setDetailState] = useState<'idle' | 'loading' | 'done' | 'none'>('idle')

  const hasShapeInfo =
    medication.drug_shape || medication.color_class1 || medication.form_code_name ||
    medication.print_front || medication.print_back || medication.mark_code_front || medication.mark_code_back

  const handleExpand = async () => {
    const next = !expanded
    setExpanded(next)
    if (next && detailState === 'idle' && !medication.usage_info) {
      setDetailState('loading')
      try {
        const res = await fetch(`/api/medications/detail?id=${medication.id}`)
        const data = await res.json()
        if (data.medication) setMedication(data.medication)
        setDetailState(data.hasDetail ? 'done' : 'none')
      } catch {
        setDetailState('none')
      }
    }
  }

  const markText = [medication.print_front, medication.print_back, medication.mark_code_front, medication.mark_code_back]
    .filter(Boolean).join(' / ')
  const colorText = [medication.color_class1, medication.color_class2].filter(Boolean).join(' + ')

  return (
    <div className="bg-white rounded-3xl border border-sage-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* 약 이미지 */}
          <div className="w-16 h-16 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center shrink-0 overflow-hidden">
            {medication.image_url ? (
              <img
                src={medication.image_url}
                alt={medication.item_name}
                className="w-full h-full object-cover"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <span className={`text-2xl ${medication.image_url ? 'hidden' : ''}`}>💊</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sage-900 break-keep leading-snug">{medication.item_name}</h3>
                {medication.entp_name && (
                  <p className="text-xs text-sage-400 mt-0.5">{medication.entp_name}</p>
                )}
                {medication.class_name && (
                  <span className="inline-block mt-1.5 text-xs bg-mint-50 text-mint-700 border border-mint-100 px-2.5 py-0.5 rounded-full font-medium">
                    {medication.class_name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {showAddButton && (
                  <Link
                    href={`/schedule/new?med=${medication.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold text-mint-600 bg-mint-50 hover:bg-mint-100 border border-mint-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 추가
                  </Link>
                )}
                <button
                  onClick={handleExpand}
                  aria-label={expanded ? '접기' : '상세 보기'}
                  className="w-8 h-8 text-sage-400 hover:text-sage-600 rounded-xl hover:bg-sage-50 flex items-center justify-center transition-colors"
                >
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {hasShapeInfo && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <Badge label="모양" value={medication.drug_shape} />
                <Badge label="색상" value={colorText || undefined} />
                <Badge label="제형" value={medication.form_code_name} />
                {markText && <Badge label="각인" value={markText} />}
              </div>
            )}

            {!expanded && medication.efficacy && (
              <p className="text-xs text-sage-500 mt-2.5 line-clamp-2 leading-relaxed">
                {medication.efficacy}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      {expanded && (
        <div className="border-t border-sage-50 bg-sage-50/50 px-5 py-4 space-y-4">
          {detailState === 'loading' && (
            <div className="flex items-center gap-2 py-2 text-sage-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">상세 정보를 불러오는 중...</span>
            </div>
          )}
          {detailState === 'none' && !medication.efficacy && (
            <p className="text-xs text-sage-400 py-2">이 약품의 상세 정보는 제공되지 않습니다.</p>
          )}

          {[
            { label: '효능·효과',  content: medication.efficacy },
            { label: '용법·용량',  content: medication.usage_info },
            { label: '주의사항',   content: medication.caution },
            { label: '부작용',     content: medication.side_effect },
            { label: '상호작용',   content: medication.interaction_info },
          ].filter(i => i.content).map(({ label, content }) => (
            <div key={label}>
              <p className="text-xs font-bold text-sage-500 uppercase tracking-wide mb-1.5">{label}</p>
              <p className="text-xs text-sage-700 leading-relaxed whitespace-pre-line">{content}</p>
            </div>
          ))}

          {medication.chart && (
            <div>
              <p className="text-xs font-bold text-sage-500 uppercase tracking-wide mb-1.5">성상</p>
              <p className="text-xs text-sage-700 leading-relaxed">{medication.chart}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-sage-100">
            <p className="text-xs text-sage-400">⚠️ 참고용 정보이며 의료 진단을 대체하지 않습니다</p>
            {showAddButton && (
              <Link
                href={`/schedule/new?med=${medication.id}`}
                className="text-xs font-semibold text-white bg-mint-500 hover:bg-mint-600 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> 일정 등록
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
