import { formatCurrency } from '@/lib/formatting'

interface BudgetAlertProps {
  alerts: Array<{
    categoryName: string
    percentage: number
    level: 'warning' | 'danger'
    overBudgetAmount?: number
  }>
}

export function BudgetAlert({ alerts }: BudgetAlertProps) {
  if (!alerts.length) {
    return null
  }

  const shown = alerts.slice(0, 2)
  const remainder = alerts.length - shown.length

  return (
    <div className="space-y-2">
      {shown.map((alert, index) => (
        <div
          key={`${alert.categoryName}-${index}`}
          className={
            alert.level === 'danger'
              ? 'rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800'
              : 'rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'
          }
        >
          {alert.level === 'danger'
            ? `🔴 ${alert.categoryName} is over budget by ${formatCurrency(Math.max(alert.overBudgetAmount ?? 0, 0))}`
            : `⚠ ${alert.categoryName} is at ${alert.percentage.toFixed(0)}% of budget`}
        </div>
      ))}
      {remainder > 0 ? <p className="text-sm text-blue-600">and {remainder} more...</p> : null}
    </div>
  )
}
