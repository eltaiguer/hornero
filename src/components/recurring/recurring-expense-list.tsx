import { formatCurrency, formatShortDateLabel } from '@/lib/formatting'

interface RecurringExpenseListProps {
  items: Array<{
    id: string
    description: string
    amount: number
    frequency: string
    nextDueDate: string | Date
    active: boolean
    emoji?: string | null
  }>
}

function formatFrequency(frequency: string) {
  if (frequency === 'daily') return 'Daily'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'monthly') return 'Monthly'
  return 'Yearly'
}

export function RecurringExpenseList({ items }: RecurringExpenseListProps) {
  if (!items.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No recurring expenses</p>
        <p className="text-sm text-blue-600 mt-2">Add a recurring expense</p>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className={`rounded-md border p-4 space-y-2 ${item.active ? '' : 'opacity-60'}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">{item.emoji ?? '📁'} {item.description}</p>
            <span className={item.active
              ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium'
              : 'rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-medium'}>
              {item.active ? '● Active' : '⏸ Paused'}
            </span>
          </div>
          <p className="text-xs text-gray-500">{formatCurrency(item.amount)} · {formatFrequency(item.frequency)}</p>
          <p className="text-xs text-gray-500">Next: {item.active ? formatShortDateLabel(item.nextDueDate) : '—'}</p>
        </li>
      ))}
    </ul>
  )
}
