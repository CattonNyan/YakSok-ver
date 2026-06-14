export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col animate-pulse">
      <div className="h-8 bg-sage-200 dark:bg-sage-700 rounded-xl w-24 mb-2" />
      <div className="h-4 bg-sage-100 dark:bg-sage-700/60 rounded-xl w-48 mb-6" />
      <div className="flex-1 bg-white dark:bg-sage-800 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 bg-sage-100 dark:bg-sage-700/60 rounded-full shrink-0" />
          <div className="h-16 bg-sage-100 dark:bg-sage-700/60 rounded-2xl flex-1" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-sage-100 dark:bg-sage-700/60 rounded-full w-40" />
          ))}
        </div>
      </div>
      <div className="mt-4 h-12 bg-sage-100 dark:bg-sage-700/60 rounded-2xl" />
    </div>
  )
}
