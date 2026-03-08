export default function RecurringLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-md border p-3">
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/3 mt-2 animate-pulse" />
        </div>
      ))}
    </main>
  )
}
