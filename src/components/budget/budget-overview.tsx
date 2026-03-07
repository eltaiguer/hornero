import { BudgetProgressBar } from './budget-progress-bar'

interface BudgetOverviewProps {
  items: Array<{
    categoryId: string
    categoryName: string
    budgetAmount: number
    actualSpent: number
    percentage: number
  }>
}

export function BudgetOverview({ items }: BudgetOverviewProps) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No budgets set for this month.</p>
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <BudgetProgressBar key={item.categoryId} {...item} />
      ))}
    </div>
  )
}
