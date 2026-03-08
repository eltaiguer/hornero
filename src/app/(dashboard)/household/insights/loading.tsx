export default function InsightsLoading() {
  return (
    <main className="mx-auto max-w-4xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="rounded-md border p-4 h-[120px]">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-1/4 mt-2 animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4 h-[200px] flex items-center justify-center"><div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse" /></div>
        <div className="rounded-md border p-4 h-[200px]"><div className="h-full w-full bg-gray-200 rounded animate-pulse" /></div>
      </div>
    </main>
  )
}
