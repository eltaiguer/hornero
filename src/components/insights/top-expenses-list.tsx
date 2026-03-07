interface TopExpensesListProps {
  items: Array<{ id: string; description: string; amount: number }>
}

export function TopExpensesList({ items }: TopExpensesListProps) {
  return (
    <ol className="space-y-2 rounded-md border p-4 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          {item.description} — ${item.amount.toFixed(2)}
        </li>
      ))}
    </ol>
  )
}
