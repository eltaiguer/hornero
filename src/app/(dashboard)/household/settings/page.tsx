import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHouseholdById, updateHouseholdSettings } from '@/services/household.service'
import { isHouseholdOwner } from '@/services/member.service'
import type { UpdateHouseholdSettingsInput } from '@/lib/validations/household'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const { id } = await searchParams
  if (!id) {
    redirect('/dashboard')
  }

  const household = await getHouseholdById(id)
  if (!household) {
    notFound()
  }

  const isOwner = await isHouseholdOwner(id, session.user.id)
  if (!isOwner) {
    redirect('/dashboard')
  }

  async function handleUpdate(formData: FormData) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const input: UpdateHouseholdSettingsInput = {
      name: formData.get('name') as string,
    }
    await updateHouseholdSettings(id!, input)
    redirect(`/household/settings?id=${id}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
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
    </main>
  )
}
