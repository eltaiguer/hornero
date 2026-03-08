import Link from 'next/link'
import { formatCurrency } from '@/lib/formatting'

interface BudgetAlert {
  categoryName: string
  categoryEmoji: string
  percentage: number
  level: 'warning' | 'danger'
  budgetAmount: number
  actualSpent: number
}

interface DashboardBudgetAlertsProps {
  alerts: BudgetAlert[]
  householdId: string
}

export function DashboardBudgetAlerts({ alerts, householdId }: DashboardBudgetAlertsProps) {
  if (alerts.length === 0) return null

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Budget Alerts</h2>
        <Link
          href={`/household/budgets?householdId=${householdId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          View budgets
        </Link>
      </div>

      <div className="rounded-md border p-4 space-y-3">
        {alerts.map((alert) => {
          const barColor = alert.level === 'danger' ? 'bg-red-500' : 'bg-amber-500'
          const barWidth = Math.min(alert.percentage, 100)

          return (
            <div key={alert.categoryName} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {alert.categoryEmoji} {alert.categoryName}
                </span>
                <span className="text-xs text-gray-500 tabular-nums">
                  {formatCurrency(alert.actualSpent)} / {formatCurrency(alert.budgetAmount)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
