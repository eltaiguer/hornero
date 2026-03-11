export default function MembersLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-md border p-4 space-y-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </main>
  )
}
