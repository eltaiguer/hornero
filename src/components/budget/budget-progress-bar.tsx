import Link from 'next/link'
import { clamp, formatCurrency } from '@/lib/formatting'

interface BudgetProgressBarProps {
  categoryName: string
  categoryEmoji?: string
  budgetAmount: number
  actualSpent: number
  percentage: number
  editHref?: string
}

export function BudgetProgressBar({
  categoryName,
  categoryEmoji,
  budgetAmount,
  actualSpent,
  percentage,
  editHref,
}: BudgetProgressBarProps) {
  const width = clamp(percentage, 0, 100)

  const tone = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'normal'
  const barClass = tone === 'danger' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-blue-600'

  return (
    <div className="rounded-md border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{categoryEmoji ?? '📁'} {categoryName}</p>
        <div className="flex items-center gap-2">
          {tone === 'warning' ? (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">⚠ {percentage.toFixed(0)}%</span>
          ) : null}
          {tone === 'danger' ? (
            <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">🔴 {percentage.toFixed(0)}%</span>
          ) : null}
          {editHref ? <Link href={editHref} className="text-xs font-medium text-blue-600">Edit</Link> : null}
        </div>
      </div>
      <p className="text-xs text-gray-500">
        {formatCurrency(actualSpent)} of {formatCurrency(budgetAmount)} spent · {percentage.toFixed(0)}%
      </p>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-2 ${barClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}
