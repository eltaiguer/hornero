'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const ITEMS = [
  { icon: '🏠', label: 'Home', href: '/household' },
  { icon: '💰', label: 'Expenses', href: '/household/expenses' },
  { icon: '📊', label: 'Budgets', href: '/household/budgets' },
  { icon: '📈', label: 'Insights', href: '/household/insights' },
] as const

function withHouseholdId(href: string, householdId?: string) {
  if (!householdId) return href
  return `${href}?householdId=${householdId}`
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const params = useSearchParams()
  const householdId = params.get('householdId') ?? params.get('id') ?? undefined

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white md:hidden pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.label}>
              <Link
                href={withHouseholdId(item.href, householdId)}
                className={`flex flex-col items-center py-2 text-xs ${active ? 'font-semibold text-blue-700' : 'text-gray-600'}`}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
