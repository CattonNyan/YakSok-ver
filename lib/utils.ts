import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function getCompletionRate(taken: number, total: number) {
  if (total === 0) return 0
  return Math.round((taken / total) * 100)
}

export const TIME_SLOT_LABELS = {
  morning: '아침',
  lunch:   '점심',
  dinner:  '저녁',
  bedtime: '취침 전',
} as const
