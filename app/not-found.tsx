import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-7xl mb-6">💊</p>
        <h1 className="text-3xl font-bold text-sage-900 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sage-500 mb-8">요청하신 페이지가 존재하지 않거나 이동되었습니다</p>
        <Link href="/" className="btn-primary">홈으로 돌아가기</Link>
      </div>
    </div>
  )
}
