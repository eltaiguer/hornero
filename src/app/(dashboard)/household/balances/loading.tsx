export default function BalancesLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-36 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="rounded-md border p-4">
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-1/4 mt-2 animate-pulse" />
          <div className="h-1.5 bg-gray-200 rounded-full w-full mt-3 animate-pulse" />
        </div>
      ))}
    </main>
  )
}
