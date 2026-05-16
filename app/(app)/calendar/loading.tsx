export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-sage-200 rounded-xl w-32 mb-2" />
      <div className="h-4 bg-sage-100 rounded-xl w-48 mb-6" />
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-8 bg-sage-100 rounded-lg" />
          <div className="h-6 bg-sage-200 rounded-xl w-32" />
          <div className="h-8 w-8 bg-sage-100 rounded-lg" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-10 bg-sage-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
