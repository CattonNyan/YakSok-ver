export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
      <div>
        <div className="h-4 bg-sage-200 dark:bg-sage-700 rounded-xl w-24 mb-2" />
        <div className="h-8 bg-sage-200 dark:bg-sage-700 rounded-xl w-48" />
      </div>
      <div className="bg-mint-400/60 dark:bg-mint-600/30 rounded-2xl p-5 h-28" />
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-sage-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-100 dark:bg-sage-700/60 rounded-lg" />
            <div className="h-5 bg-sage-100 dark:bg-sage-700/60 rounded-xl w-20" />
          </div>
          {[1, 2].map(j => (
            <div key={j} className="h-12 bg-sage-50 dark:bg-sage-700/40 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  )
}
