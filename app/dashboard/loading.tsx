export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-sage-200 rounded-xl w-48" />
      <div className="h-4 bg-sage-100 rounded-xl w-64" />
      <div className="card space-y-3">
        <div className="h-24 bg-sage-100 rounded-xl" />
        <div className="h-4 bg-sage-100 rounded-xl w-3/4" />
        <div className="h-4 bg-sage-100 rounded-xl w-1/2" />
      </div>
      <div className="card space-y-3">
        <div className="h-4 bg-sage-100 rounded-xl" />
        <div className="h-4 bg-sage-100 rounded-xl w-5/6" />
        <div className="h-4 bg-sage-100 rounded-xl w-4/6" />
      </div>
    </div>
  )
}
