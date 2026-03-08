import { formatCurrency } from '@/lib/formatting'

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
  const increased = vsLastMonthPct > 0
  const arrow = increased ? '▲' : '▼'
  const trendClass = increased ? 'text-red-600' : 'text-green-600'

  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-gray-500">Total spent</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalSpent)}</p>
        <p className={`text-sm font-medium ${trendClass}`}>{arrow} {Math.abs(vsLastMonthPct).toFixed(0)}%</p>
      </div>
      <p className="text-sm text-gray-500 mt-1">{vsBudgetPct.toFixed(0)}% of monthly budget used</p>
    </div>
  )
}
