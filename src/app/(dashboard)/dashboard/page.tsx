import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { CreateHouseholdForm } from '@/components/household/create-household-form'
import { createHousehold } from '@/services/household.service'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)

  async function handleCreate(data: { name: string; currency: string }) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const household = await createHousehold(data as any, s.user.id)
    redirect(`/household/members?id=${household.id}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome, {session.user.name ?? session.user.email}</p>

      {households.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h2 className="text-lg font-semibold">Your households</h2>
          <ul className="space-y-2">
            {households.map((h) => (
              <li key={h.id} className="rounded-md border p-4">
                <Link href={`/household/members?id=${h.id}`} className="font-medium hover:underline">
                  {h.name}
                </Link>
                <span className="ml-2 text-sm text-gray-500">{h.currency}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-gray-600">You don&apos;t belong to any household yet. Create one to get started.</p>
          <CreateHouseholdForm onSubmit={handleCreate} />
        </div>
      )}
    </main>
  )
}
