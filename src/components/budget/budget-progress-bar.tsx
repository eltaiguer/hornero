interface BudgetProgressBarProps {
  categoryName: string
  budgetAmount: number
  actualSpent: number
  percentage: number
}

export function BudgetProgressBar({
  categoryName,
  budgetAmount,
  actualSpent,
  percentage,
}: BudgetProgressBarProps) {
  const width = Math.min(100, Math.max(0, percentage))

  return (
    <div className="space-y-1 rounded-md border p-3">
      <p className="font-medium">{categoryName}</p>
      <p className="text-sm text-gray-600">
        ${actualSpent.toFixed(2)} of ${budgetAmount.toFixed(2)} spent
      </p>
      <div className="h-2 rounded bg-gray-200">
        <div className="h-2 rounded bg-blue-600" style={{ width: `${width}%` }} />
      </div>
      <p className="text-xs text-gray-500">{percentage}%</p>
    </div>
  )
}
