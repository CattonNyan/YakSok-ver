export default function Loading() {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-sage-200 rounded-xl w-24 mb-2" />
      <div className="flex flex-col items-center gap-2">
        <div className="h-20 w-20 bg-sage-100 rounded-full" />
        <div className="h-4 bg-sage-100 rounded-xl w-40" />
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <div className="h-6 bg-sage-200 rounded-xl w-24" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1">
            <div className="h-4 bg-sage-100 rounded-xl w-20" />
            <div className="h-10 bg-sage-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-sage-200 rounded-2xl" />
    </div>
  )
}
