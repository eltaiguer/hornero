import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'

const NAV_ITEMS = [
  { label: 'Expenses', href: '/household/expenses' },
  { label: 'Budgets', href: '/household/budgets' },
  { label: 'Balances', href: '/household/balances' },
  { label: 'Recurring', href: '/household/recurring' },
  { label: 'Insights', href: '/household/insights' },
  { label: 'Categories', href: '/household/categories' },
  { label: 'Settings', href: '/household/settings' },
]

export default async function HouseholdHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)
  const params = (await searchParams) ?? {}
  const householdId = params.householdId ?? households[0]?.id

  if (!householdId) {
    redirect('/dashboard')
  }

  const household = households.find((item) => item.id === householdId) ?? households[0]

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Home</h1>
        <p className="text-sm text-gray-500 mt-1">{household?.name}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={`${item.href}?householdId=${householdId}`}
            className="rounded-md border p-4 text-sm font-medium hover:bg-gray-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  )
}
