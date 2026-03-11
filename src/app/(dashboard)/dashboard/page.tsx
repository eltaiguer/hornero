import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { CreateHouseholdForm } from '@/components/household/create-household-form'
import { createHousehold } from '@/services/household.service'
import type { CreateHouseholdInput } from '@/lib/validations/household'
import { acceptInviteByToken, getPendingInvitesByEmail } from '@/services/invite.service'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)

  // If user has households, go straight to the household dashboard
  if (households.length > 0) {
    redirect('/household')
  }

  const pendingInvites = session.user.email
    ? await getPendingInvitesByEmail(session.user.email)
    : []

  async function handleCreate(data: CreateHouseholdInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const household = await createHousehold(data, s.user.id)
    redirect(`/household?householdId=${household.id}`)
  }

  async function handleAcceptInvite(token: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id || !s.user.email) throw new Error('Unauthorized')
    await acceptInviteByToken(token, s.user.id, s.user.email)
    redirect('/dashboard')
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p className="mt-2 text-gray-600">Hi, {session.user.name ?? session.user.email}</p>

      {pendingInvites.length > 0 && (
        <section className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-lg font-semibold text-blue-900">Pending invites</h2>
          <ul className="mt-3 space-y-2">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 rounded-md bg-white p-3">
                <p className="text-sm text-gray-700">
                  Join <span className="font-medium">{invite.household.name}</span>
                </p>
                <form action={handleAcceptInvite.bind(null, invite.token)}>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Accept invite
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 space-y-4">
        <p className="text-gray-600">You don&apos;t belong to any household yet. Create one to get started.</p>
        <CreateHouseholdForm onSubmit={handleCreate} />
      </div>
    </main>
  )
}
