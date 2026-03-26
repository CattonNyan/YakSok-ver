'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { Medication } from '@/types'
import clsx from 'clsx'

interface Props {
  medication: Medication
  showAddButton?: boolean
  compact?: boolean
}

export default function MedicationCard({ medication, showAddButton, compact }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* 약 이미지 */}
        <div className="w-14 h-14 rounded-xl bg-sage-100 flex items-center justify-center shrink-0 overflow-hidden">
          {medication.image_url ? (
            <img src={medication.image_url} alt={medication.item_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">💊</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sage-900 truncate">{medication.item_name}</h3>
              {medication.entp_name && (
                <p className="text-xs text-sage-500 mt-0.5">{medication.entp_name}</p>
              )}
              {medication.class_name && (
                <span className="inline-block mt-1 text-xs bg-sage-100 text-sage-600 px-2 py-0.5 rounded-full">
                  {medication.class_name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {showAddButton && (
                <Link href={`/schedule/new?med=${medication.id}`}
                  className="p-1.5 bg-mint-50 text-mint-600 rounded-lg hover:bg-mint-100 transition-colors">
                  <Plus className="w-4 h-4" />
                </Link>
              )}
              <button onClick={() => setExpanded(!expanded)}
                className="p-1.5 text-sage-400 hover:text-sage-600 rounded-lg hover:bg-sage-50 transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 효능 미리보기 */}
          {!expanded && medication.efficacy && (
            <p className="text-xs text-sage-500 mt-2 line-clamp-2 leading-relaxed">
              {medication.efficacy}
            </p>
          )}
        </div>
      </div>

      {/* 상세 정보 */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-sage-100 space-y-3">
          {[
            { label: '효능·효과', content: medication.efficacy },
            { label: '용법·용량', content: medication.usage_info },
            { label: '주의사항', content: medication.caution },
            { label: '부작용', content: medication.side_effect },
            { label: '상호작용', content: medication.interaction_info },
          ].filter(i => i.content).map(({ label, content }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-sage-700 mb-1">{label}</p>
              <p className="text-xs text-sage-600 leading-relaxed whitespace-pre-line">
                {content}
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-sage-400">⚠️ 참고용 정보이며 의료 진단을 대체하지 않습니다</p>
            {showAddButton && (
              <Link href={`/schedule/new?med=${medication.id}`}
                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <Plus className="w-3 h-3" /> 일정 등록
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
