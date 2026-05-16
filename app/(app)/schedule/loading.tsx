export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 bg-sage-200 rounded-xl w-32 mb-2" />
          <div className="h-4 bg-sage-100 rounded-xl w-48" />
        </div>
        <div className="h-10 bg-sage-200 rounded-xl w-24" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-sage-100 rounded-xl w-40" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-sage-100 rounded-lg" />
              <div className="h-8 w-8 bg-sage-100 rounded-lg" />
            </div>
          </div>
          <div className="h-4 bg-sage-100 rounded-xl w-28" />
          <div className="h-4 bg-sage-100 rounded-xl w-36" />
        </div>
      ))}
    </div>
  )
}
