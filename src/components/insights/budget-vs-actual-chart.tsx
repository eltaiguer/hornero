interface BudgetVsActualChartProps {
  data: Array<{ category: string; budget: number; actual: number }>
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  return (
    <ul className="space-y-2 rounded-md border p-4 text-sm">
      {data.map((item) => (
        <li key={item.category}>
          {item.category}: budget ${item.budget.toFixed(2)} / actual ${item.actual.toFixed(2)}
        </li>
      ))}
    </ul>
  )
}
