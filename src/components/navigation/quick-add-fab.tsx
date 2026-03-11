'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function QuickAddFab() {
  const params = useSearchParams()
  const householdId = params.get('householdId') ?? params.get('id')

  if (!householdId) return null

  return (
    <Link
      href={`/household/expenses/new?householdId=${householdId}`}
      className="fixed bottom-24 right-4 z-50 md:bottom-6 rounded-full bg-blue-600 text-white w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 active:scale-95 transition-transform"
      aria-label="Add expense"
    >
      <span className="text-2xl font-light">+</span>
    </Link>
  )
}
