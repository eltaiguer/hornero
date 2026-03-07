interface ExpenseListProps {
  expenses: Array<{
    id: string
    description: string
    amount: number
    date: string | Date
    category: { name: string; emoji?: string | null }
    payer: { name?: string | null }
  }>
}

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (!expenses.length) {
    return <p className="text-sm text-gray-500">No expenses yet</p>
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => (
        <li key={expense.id} className="rounded-md border p-3">
          <p className="font-medium">
            {expense.category.emoji ? `${expense.category.emoji} ` : ''}
            {expense.description}
          </p>
          <p className="text-sm text-gray-600">Paid by {expense.payer.name ?? 'Unknown'}</p>
          <p className="text-sm font-semibold">${expense.amount.toFixed(2)}</p>
        </li>
      ))}
    </ul>
  )
}
