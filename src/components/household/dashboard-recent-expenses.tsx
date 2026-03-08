import Link from 'next/link'
import { formatCurrency, formatRelativeExpenseDate } from '@/lib/formatting'

interface RecentExpense {
  id: string
  description: string
  amount: number
  date: Date | string
  category: { name: string; emoji?: string | null }
  payer: { name?: string | null }
}

interface DashboardRecentExpensesProps {
  expenses: RecentExpense[]
  householdId: string
}

export function DashboardRecentExpenses({
  expenses,
  householdId,
}: DashboardRecentExpensesProps) {
  const expensesHref = `/household/expenses?householdId=${householdId}`

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Expenses</h2>
        <Link href={expensesHref} className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-md border p-4 text-center text-sm text-gray-500">
          No expenses yet.{' '}
          <Link
            href={`/household/expenses/new?householdId=${householdId}`}
            className="text-blue-600 hover:underline"
          >
            Add your first expense
          </Link>
        </div>
      ) : (
        <div className="rounded-md border divide-y">
          {expenses.map((expense) => (
            <Link
              key={expense.id}
              href={`/household/expenses/${expense.id}?householdId=${householdId}`}
              className="flex items-center justify-between p-3 hover:bg-gray-50 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0">{expense.category.emoji ?? '📁'}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{expense.description}</p>
                  <p className="text-xs text-gray-500">
                    {expense.payer.name ?? 'Unknown'} &middot;{' '}
                    {formatRelativeExpenseDate(expense.date)}
                  </p>
                </div>
              </div>
              <span className="font-medium tabular-nums shrink-0 ml-2">
                {formatCurrency(expense.amount)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
