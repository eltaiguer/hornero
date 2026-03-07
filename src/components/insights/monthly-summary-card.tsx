interface MonthlySummaryCardProps {
  totalSpent: number
  vsLastMonthPct: number
  vsBudgetPct: number
}

export function MonthlySummaryCard({
  totalSpent,
  vsLastMonthPct,
  vsBudgetPct,
}: MonthlySummaryCardProps) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-gray-600">Total spent</p>
      <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
      <p className="text-sm text-gray-600">vs last month: {vsLastMonthPct}%</p>
      <p className="text-sm text-gray-600">vs budget: {vsBudgetPct}%</p>
    </div>
  )
}
