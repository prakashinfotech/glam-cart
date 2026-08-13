export default function LoadingGrid({ count = 8, cols = 'grid-cols-2 md:grid-cols-4' }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="card animate-pulse">
          <div className="aspect-[3/4] bg-gray-200 rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
