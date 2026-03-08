export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="rounded-md border p-4">
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded w-1/4 mt-2 animate-pulse" />
        <div className="h-1.5 bg-gray-200 rounded-full w-full mt-3 animate-pulse" />
      </div>
      <div className="rounded-md border p-4 h-[200px] flex items-center justify-center">
        <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </main>
  )
}
