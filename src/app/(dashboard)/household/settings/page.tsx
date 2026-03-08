import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHouseholdById, updateHouseholdSettings } from '@/services/household.service'
import { isHouseholdOwner } from '@/services/member.service'
import type { UpdateHouseholdSettingsInput } from '@/lib/validations/household'
import { PushNotificationsToggle } from '@/components/settings/push-notifications-toggle'

interface Props {
  searchParams: Promise<{ id?: string; householdId?: string }>
}

function requireUserId(value: string | null | undefined): string {
  if (!value) {
    throw new Error('Unauthorized')
  }

  return value
}

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const params = await searchParams
  const householdId = params.householdId ?? params.id
  if (!householdId) {
    redirect('/dashboard')
  }
  const householdIdValue: string = householdId

  const household = await getHouseholdById(householdIdValue)
  if (!household) {
    notFound()
  }

  const isOwner = await isHouseholdOwner(householdIdValue, session.user.id)
  if (!isOwner) {
    redirect('/dashboard')
  }

  async function handleUpdate(formData: FormData) {
    'use server'
    const s = await auth()
    requireUserId(s?.user?.id)
    const input: UpdateHouseholdSettingsInput = {
      name: formData.get('name') as string,
    }
    await updateHouseholdSettings(householdIdValue, input)
    redirect(`/household/settings?householdId=${householdIdValue}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6">
      <h1 className="text-2xl font-bold">Household Settings</h1>

      <form action={handleUpdate} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Household name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={household.name}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Currency</label>
          <p className="mt-1 text-sm text-gray-500">{household.currency}</p>
        </div>

        <div>
          <label className="block text-sm font-medium">Split method</label>
          <p className="mt-1 text-sm text-gray-500">{household.defaultSplitMethod}</p>
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Save changes
        </button>
      </form>

      <div className="mt-6">
        <PushNotificationsToggle householdId={householdIdValue} />
      </div>
    </main>
  )
}
