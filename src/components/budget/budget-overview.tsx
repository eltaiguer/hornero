import Link from 'next/link'
import { formatCurrency } from '@/lib/formatting'
import { BudgetProgressBar } from './budget-progress-bar'

interface BudgetOverviewProps {
  items: Array<{
    budgetId: string
    categoryId: string
    categoryName: string
    categoryEmoji?: string
    budgetAmount: number
    actualSpent: number
    percentage: number
  }>
  householdId?: string
  month?: number
  year?: number
}

export function BudgetOverview({ items, householdId, month, year }: BudgetOverviewProps) {
  const createHref = householdId
    ? `/household/budgets?householdId=${householdId}${month ? `&month=${month}` : ''}${year ? `&year=${year}` : ''}#budget-form`
    : undefined

  if (!items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No budgets set for this month</p>
        {createHref ? (
          <Link
            href={createHref}
            className="mt-3 inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Set your first budget
          </Link>
        ) : (
          <p className="text-sm text-blue-600 mt-2">Set your first budget</p>
        )}
      </div>
    )
  }

  const totalSpent = items.reduce((sum, item) => sum + item.actualSpent, 0)
  const totalBudget = items.reduce((sum, item) => sum + item.budgetAmount, 0)
  const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-2">
        <p className="text-sm font-medium">
          Overall: {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)} ({totalPercentage}%)
        </p>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-2 bg-blue-600" style={{ width: `${Math.min(totalPercentage, 100)}%` }} />
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <BudgetProgressBar
            key={item.categoryId}
            {...item}
            editHref={householdId && month && year
              ? `/household/budgets?householdId=${householdId}&month=${month}&year=${year}&editBudgetId=${item.budgetId}`
              : undefined}
          />
        ))}
      </div>
    </div>
  )
}
