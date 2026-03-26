'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl mb-4">⚠️</p>
        <h2 className="text-2xl font-bold text-sage-900 mb-2">오류가 발생했습니다</h2>
        <p className="text-sage-500 mb-6 text-sm">{error.message}</p>
        <button onClick={reset} className="btn-primary">다시 시도</button>
      </div>
    </div>
  )
}
