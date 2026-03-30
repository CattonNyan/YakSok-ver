export default function Loading() {
  return (
    <div className="flex flex-col gap-4 h-full animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-sage-200 rounded-xl w-36 mb-2" />
          <div className="h-4 bg-sage-100 rounded-xl w-52" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-sage-100 rounded-xl" />
          <div className="h-10 w-24 bg-sage-200 rounded-xl" />
        </div>
      </div>
      <div className="h-12 bg-sage-100 rounded-2xl" />
      <div className="flex-1 bg-sage-100 rounded-2xl min-h-64" />
    </div>
  )
}
