interface RecurringExpenseListProps {
  items: Array<{
    id: string
    description: string
    amount: number
    frequency: string
    nextDueDate: string | Date
    active: boolean
  }>
}

export function RecurringExpenseList({ items }: RecurringExpenseListProps) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No recurring expenses configured.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border p-3">
          <p className="font-medium">{item.description}</p>
          <p className="text-sm text-gray-600">${item.amount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{item.frequency}</p>
          <p className="text-xs text-gray-500">{item.active ? 'active' : 'paused'}</p>
        </li>
      ))}
    </ul>
  )
}
