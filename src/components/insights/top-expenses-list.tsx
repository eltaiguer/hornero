import { formatCurrency } from '@/lib/formatting'

interface TopExpensesListProps {
  items: Array<{ id: string; description: string; amount: number; emoji?: string | null }>
}

export function TopExpensesList({ items }: TopExpensesListProps) {
  if (!items.length) {
    return <p className="text-sm text-gray-500 text-center">Not enough data yet</p>
  }

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-sm font-semibold mb-2">Top Expenses</h3>
      <ol className="space-y-1">
        {items.slice(0, 5).map((item, index) => (
          <li key={item.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400 w-6">{index + 1}.</span>
              <span>{item.emoji ?? '📁'} {item.description}</span>
            </div>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
