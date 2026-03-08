import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHouseholdById, updateHouseholdSettings } from '@/services/household.service'
import { isHouseholdOwner, getHouseholdMembers, getSalaryHistory } from '@/services/member.service'
import { SUPPORTED_CURRENCIES, SPLIT_METHODS } from '@/lib/validations/household'
import type { UpdateHouseholdSettingsInput } from '@/lib/validations/household'
import { PushNotificationsToggle } from '@/components/settings/push-notifications-toggle'
import { SalaryHistorySection } from '@/components/settings/salary-history-section'

const SPLIT_METHOD_LABELS: Record<string, string> = {
  equal: 'Equal',
  proportional: 'By Income',
  custom: 'Custom',
}

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

  const [isOwner, members] = await Promise.all([
    isHouseholdOwner(householdIdValue, session.user.id),
    getHouseholdMembers(householdIdValue),
  ])
  if (!isOwner) {
    redirect('/dashboard')
  }

  const membersWithHistory = await Promise.all(
    members.map(async (member) => {
      const history = await getSalaryHistory(householdIdValue, member.userId)
      return {
        userId: member.userId,
        name: member.user.name ?? member.user.email ?? 'Unknown',
        currentSalary: member.salary,
        history,
      }
    })
  )

  async function handleUpdate(formData: FormData) {
    'use server'
    const s = await auth()
    requireUserId(s?.user?.id)
    const input: UpdateHouseholdSettingsInput = {
      name: formData.get('name') as string,
      currency: formData.get('currency') as typeof SUPPORTED_CURRENCIES[number],
      defaultSplitMethod: formData.get('defaultSplitMethod') as typeof SPLIT_METHODS[number],
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
          <label htmlFor="currency" className="block text-sm font-medium">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            defaultValue={household.currency}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          >
            {SUPPORTED_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-amber-600">
            Changing currency will not convert existing amounts.
          </p>
        </div>

        <div>
          <label htmlFor="defaultSplitMethod" className="block text-sm font-medium">
            Default split method
          </label>
          <select
            id="defaultSplitMethod"
            name="defaultSplitMethod"
            defaultValue={household.defaultSplitMethod}
            className="mt-1 block w-full rounded-md border px-3 py-2"
          >
            {SPLIT_METHODS.map((method) => (
              <option key={method} value={method}>
                {SPLIT_METHOD_LABELS[method] ?? method}
              </option>
            ))}
          </select>
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

      <div className="mt-6">
        <SalaryHistorySection members={membersWithHistory} />
      </div>
    </main>
  )
}
