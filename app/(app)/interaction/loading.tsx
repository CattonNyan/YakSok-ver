export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-sage-200 rounded-xl w-36 mb-2" />
      <div className="h-4 bg-sage-100 rounded-xl w-52 mb-6" />
      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <div className="h-5 bg-sage-200 rounded-xl w-40" />
        {[1, 2].map(i => (
          <div key={i} className="h-10 bg-sage-100 rounded-xl" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-3">
        <div className="h-12 w-12 bg-sage-100 rounded-full" />
        <div className="h-5 bg-sage-200 rounded-xl w-40" />
        <div className="h-4 bg-sage-100 rounded-xl w-60" />
      </div>
    </div>
  )
}
