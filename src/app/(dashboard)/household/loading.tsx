export default function HouseholdLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
      <div className="rounded-md border p-4 space-y-2">
        <div className="h-4 w-3/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="rounded-md border p-4 space-y-2">
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="rounded-md border p-4 space-y-2">
        <div className="h-4 w-2/5 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-gray-200" />
      </div>
    </main>
  )
}
