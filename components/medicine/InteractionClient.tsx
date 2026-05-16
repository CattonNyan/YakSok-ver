'use client'

import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle, Pill } from 'lucide-react'
import type { Medication, DrugInteraction, Severity } from '@/types'
import clsx from 'clsx'
import Link from 'next/link'

const SEVERITY_CONFIG: Record<Severity, {
  label: string
  icon: React.ElementType
  textColor: string
  bg: string
  border: string
  accent: string
}> = {
  low:             { label: '낮음',    icon: AlertTriangle, textColor: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-100', accent: 'bg-emerald-500' },
  medium:          { label: '보통',    icon: AlertTriangle, textColor: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-100',   accent: 'bg-amber-500' },
  high:            { label: '높음',    icon: ShieldAlert,   textColor: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-100',  accent: 'bg-orange-500' },
  contraindicated: { label: '병용금기', icon: XCircle,       textColor: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-100',     accent: 'bg-red-500' },
}

export default function InteractionClient({ medications, interactions }: {
  medications: Medication[]
  interactions: DrugInteraction[]
}) {
  const hasWarning = interactions.length > 0
  const highRisk = interactions.filter(i => i.severity === 'contraindicated' || i.severity === 'high')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-bold text-mint-600 tracking-widest uppercase mb-1">Drug Safety</p>
        <h1 className="text-3xl font-bold text-sage-900 tracking-tight">약물 상호작용</h1>
        <p className="text-sage-400 mt-1">현재 복용 중인 약의 위험 조합을 확인합니다</p>
      </div>

      {/* 복용 중인 약 목록 */}
      <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-sage-800">복용 중인 약</p>
          <span className="text-xs font-semibold text-sage-400 bg-sage-50 px-2.5 py-1 rounded-full">{medications.length}개</span>
        </div>
        {medications.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sage-400 text-sm mb-3">등록된 복약 일정이 없습니다</p>
            <Link href="/schedule" className="text-sm font-semibold text-mint-600 hover:text-mint-700">
              복약 일정 등록하기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {medications.map(m => (
              <span key={m.id} className="inline-flex items-center gap-2 bg-sage-50 text-sage-700 text-sm font-medium px-3 py-1.5 rounded-xl border border-sage-100">
                <Pill className="w-3.5 h-3.5 text-sage-400" />
                {m.item_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 상태별 UI */}
      {medications.length < 2 ? (
        <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-3xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-sage-300" />
          </div>
          <p className="font-semibold text-sage-600 mb-1">2개 이상의 약이 필요합니다</p>
          <p className="text-sm text-sage-400">복약 일정에 약을 추가하면 상호작용을 확인할 수 있습니다</p>
        </div>

      ) : !hasWarning ? (
        <div className="bg-white rounded-3xl border border-sage-100 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-mint-50 rounded-3xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-mint-500" />
          </div>
          <p className="text-xl font-bold text-sage-900 mb-2">안전한 조합입니다</p>
          <p className="text-sage-400 text-sm">위험한 약물 상호작용이 발견되지 않았습니다</p>
        </div>

      ) : (
        <div className="space-y-4">
          {/* 고위험 경고 배너 */}
          {highRisk.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 mb-0.5">
                  {highRisk.length}개의 위험한 조합이 발견됐습니다
                </p>
                <p className="text-xs text-red-500">즉시 의사·약사와 상담하세요.</p>
              </div>
            </div>
          )}

          {/* 상호작용 카드 목록 */}
          {interactions.map(i => {
            const cfg = SEVERITY_CONFIG[i.severity as Severity]
            const Icon = cfg.icon
            return (
              <div key={i.id} className={clsx('rounded-3xl border overflow-hidden', cfg.bg, cfg.border)}>
                <div className="flex">
                  {/* 좌측 액센트 바 */}
                  <div className={clsx('w-1 shrink-0', cfg.accent)} />
                  <div className="flex-1 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={clsx('w-4 h-4 shrink-0', cfg.textColor)} />
                      <span className={clsx('text-xs font-bold tracking-wide uppercase', cfg.textColor)}>
                        위험도 {cfg.label}
                      </span>
                    </div>
                    <p className="font-semibold text-sage-900 text-sm mb-1">
                      {i.medication_a?.item_name} ↔ {i.medication_b?.item_name}
                    </p>
                    {i.description && (
                      <p className="text-xs text-sage-600 leading-relaxed">{i.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-sage-400 text-center leading-relaxed pb-4">
        ⚠️ 본 정보는 참고용이며 의료 진단을 대체하지 않습니다.<br />
        반드시 의사 또는 약사와 상담 후 복용 여부를 결정하세요.
      </p>
    </div>
  )
}
