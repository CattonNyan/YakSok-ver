export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-sage-100 rounded-xl" />
        <div className="h-6 bg-sage-200 rounded-xl w-64" />
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4">
        <div className="w-20 h-20 bg-sage-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-sage-200 rounded-xl w-48" />
          <div className="h-4 bg-sage-100 rounded-xl w-32" />
          <div className="h-6 bg-sage-100 rounded-full w-24 mt-2" />
          <div className="h-9 bg-mint-100 rounded-xl w-32 mt-3" />
        </div>
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <div className="h-5 bg-sage-200 rounded-xl w-24" />
          <div className="h-4 bg-sage-100 rounded-xl w-full" />
          <div className="h-4 bg-sage-100 rounded-xl w-4/5" />
        </div>
      ))}
    </div>
  )
}
