import Link from 'next/link'

interface Props {
  householdId: string
}

const ITEMS = [
  { label: 'Add expense', href: '/household/expenses/new' },
  { label: 'Expenses', href: '/household/expenses' },
  { label: 'Recurring', href: '/household/recurring' },
  { label: 'Budgets', href: '/household/budgets' },
  { label: 'Balances', href: '/household/balances' },
  { label: 'Insights', href: '/household/insights' },
  { label: 'Categories', href: '/household/categories' },
  { label: 'Settings', href: '/household/settings' },
] as const

export function HouseholdNavLinks({ householdId }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={`${item.href}?householdId=${householdId}`}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
