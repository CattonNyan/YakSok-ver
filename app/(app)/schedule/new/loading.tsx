export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-sage-100 rounded-xl" />
        <div>
          <div className="h-7 bg-sage-200 rounded-xl w-24" />
          <div className="h-4 bg-sage-100 rounded-xl w-36 mt-1" />
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="h-4 bg-sage-100 rounded-xl w-20" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sage-100 rounded-xl" />
          <div className="space-y-1.5">
            <div className="h-4 bg-sage-200 rounded-xl w-48" />
            <div className="h-3 bg-sage-100 rounded-xl w-32" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="h-4 bg-sage-200 rounded-xl w-28" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-sage-100 rounded-xl flex-1" />
          ))}
        </div>
        <div className="h-10 bg-sage-100 rounded-xl w-full" />
        <div className="h-10 bg-sage-100 rounded-xl w-full" />
      </div>
      <div className="h-12 bg-mint-100 rounded-xl w-full" />
    </div>
  )
}
