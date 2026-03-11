'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const ITEMS = [
  { icon: '🏠', label: 'Home', href: '/household', match: 'exact' },
  { icon: '💸', label: 'Expenses', href: '/household/expenses', match: 'prefix' },
  { icon: '🤝', label: 'Balances', href: '/household/balances', match: 'prefix' },
  { icon: '📊', label: 'Budgets', href: '/household/budgets', match: 'prefix' },
  { icon: '📈', label: 'Insights', href: '/household/insights', match: 'prefix' },
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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match === 'exact' ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.label}>
              <Link
                href={withHouseholdId(item.href, householdId)}
                className={`relative flex flex-col items-center px-1 pb-2 pt-2 text-[11px] ${
                  active ? 'font-semibold text-blue-700' : 'text-gray-500'
                }`}
              >
                <span className={`mb-1 h-0.5 w-8 rounded-full ${active ? 'bg-blue-600' : 'bg-transparent'}`} />
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
