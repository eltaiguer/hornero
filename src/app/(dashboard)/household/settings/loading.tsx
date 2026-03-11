export default function SettingsLoading() {
  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
      <div className="rounded-md border p-4 space-y-3">
        <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    </main>
  )
}
