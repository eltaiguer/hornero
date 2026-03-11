export default function CategoriesLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-md border p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/3 mt-2 animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </main>
  )
}
