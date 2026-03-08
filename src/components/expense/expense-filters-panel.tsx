'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ExpenseFilters, type ExpenseFiltersValue } from './expense-filters'

interface Props {
  categories: Array<{ id: string; name: string; emoji?: string | null }>
  members: Array<{ id: string; name: string }>
  householdId: string
  initialValue: ExpenseFiltersValue
}

export function ExpenseFiltersPanel({
  categories,
  members,
  householdId,
  initialValue,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleApply(filters: ExpenseFiltersValue) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('householdId', householdId)

    const keys: Array<keyof ExpenseFiltersValue> = ['dateFrom', 'dateTo', 'categoryId', 'payerId', 'minAmount', 'maxAmount']

    for (const key of keys) {
      const value = filters[key]
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }

    params.delete('cursor')

    router.push(`/household/expenses?${params.toString()}`)
  }

  return (
    <ExpenseFilters
      categories={categories}
      members={members}
      initialValue={initialValue}
      onApply={handleApply}
    />
  )
}
