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
  darkBg: string
  border: string
  darkBorder: string
  accent: string
}> = {
  low:             { label: '낮음',    icon: AlertTriangle, textColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50',  darkBg: 'dark:bg-emerald-900/20',  border: 'border-emerald-100', darkBorder: 'dark:border-emerald-800', accent: 'bg-emerald-500' },
  medium:          { label: '보통',    icon: AlertTriangle, textColor: 'text-amber-700 dark:text-amber-400',     bg: 'bg-amber-50',    darkBg: 'dark:bg-amber-900/20',    border: 'border-amber-100',   darkBorder: 'dark:border-amber-800',   accent: 'bg-amber-500' },
  high:            { label: '높음',    icon: ShieldAlert,   textColor: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-50',   darkBg: 'dark:bg-orange-900/20',   border: 'border-orange-100',  darkBorder: 'dark:border-orange-800',  accent: 'bg-orange-500' },
  contraindicated: { label: '병용금기', icon: XCircle,       textColor: 'text-red-700 dark:text-red-400',        bg: 'bg-red-50',      darkBg: 'dark:bg-red-900/20',      border: 'border-red-100',     darkBorder: 'dark:border-red-800',     accent: 'bg-red-500' },
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
        <h1 className="text-3xl font-bold text-sage-900 dark:text-sage-50 tracking-tight">약물 상호작용</h1>
        <p className="text-sage-400 mt-1">현재 복용 중인 약의 위험 조합을 확인합니다</p>
      </div>

      {/* 복용 중인 약 목록 */}
      <div className="bg-white dark:bg-sage-800 rounded-3xl border border-sage-100 dark:border-sage-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-sage-800 dark:text-sage-200">복용 중인 약</p>
          <span className="text-xs font-semibold text-sage-400 bg-sage-50 dark:bg-sage-700 dark:text-sage-300 px-2.5 py-1 rounded-full">{medications.length}개</span>
        </div>
        {medications.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sage-400 text-sm mb-3">등록된 복약 일정이 없습니다</p>
            <Link href="/schedule" className="text-sm font-semibold text-mint-600 dark:text-mint-400 hover:text-mint-700">
              복약 일정 등록하기 →
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {medications.map(m => (
              <span key={m.id} className="inline-flex items-center gap-2 bg-sage-50 dark:bg-sage-700 text-sage-700 dark:text-sage-300 text-sm font-medium px-3 py-1.5 rounded-xl border border-sage-100 dark:border-sage-600">
                <Pill className="w-3.5 h-3.5 text-sage-400" />
                {m.item_name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 상태별 UI */}
      {medications.length < 2 ? (
        <div className="bg-white dark:bg-sage-800 rounded-3xl border border-sage-100 dark:border-sage-700 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-sage-50 dark:bg-sage-700 rounded-3xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-sage-300 dark:text-sage-500" />
          </div>
          <p className="font-semibold text-sage-600 dark:text-sage-300 mb-1">2개 이상의 약이 필요합니다</p>
          <p className="text-sm text-sage-400">복약 일정에 약을 추가하면 상호작용을 확인할 수 있습니다</p>
        </div>

      ) : !hasWarning ? (
        <div className="bg-white dark:bg-sage-800 rounded-3xl border border-sage-100 dark:border-sage-700 shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-mint-50 dark:bg-mint-900/20 rounded-3xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-mint-500" />
          </div>
          <p className="text-xl font-bold text-sage-900 dark:text-sage-50 mb-2">안전한 조합입니다</p>
          <p className="text-sage-400 text-sm">위험한 약물 상호작용이 발견되지 않았습니다</p>
        </div>

      ) : (
        <div className="space-y-4">
          {/* 고위험 경고 배너 */}
          {highRisk.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-0.5">
                  {highRisk.length}개의 위험한 조합이 발견됐습니다
                </p>
                <p className="text-xs text-red-500 dark:text-red-400">즉시 의사·약사와 상담하세요.</p>
              </div>
            </div>
          )}

          {/* 상호작용 카드 목록 */}
          {interactions.map(i => {
            const cfg = SEVERITY_CONFIG[i.severity as Severity]
            const Icon = cfg.icon
            return (
              <div key={i.id} className={clsx('rounded-3xl border overflow-hidden', cfg.bg, cfg.darkBg, cfg.border, cfg.darkBorder)}>
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
                    <p className="font-semibold text-sage-900 dark:text-sage-50 text-sm mb-1">
                      {i.medication_a?.item_name} ↔ {i.medication_b?.item_name}
                    </p>
                    {i.description && (
                      <p className="text-xs text-sage-600 dark:text-sage-300 leading-relaxed">{i.description}</p>
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
