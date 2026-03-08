import { formatCurrency } from '@/lib/formatting'

interface SplitRow {
  userId: string
  name: string
  amountOwed: number
  percentage: number
}

interface SplitPreviewProps {
  rows?: SplitRow[]
  splits?: Array<{ userId: string; name: string; amountOwed: number }>
  mode?: 'equal' | 'proportional' | 'custom'
  customPercentages?: Record<string, number>
  onCustomPercentageChange?: (userId: string, percentage: number) => void
  totalPercentage?: number
  error?: string
}

export function SplitPreview({
  rows,
  splits,
  mode,
  customPercentages,
  onCustomPercentageChange,
  totalPercentage,
  error,
}: SplitPreviewProps) {
  const normalizedRows = rows ?? (splits ?? []).map((split) => ({
    ...split,
    percentage: 0,
  }))
  const safeMode = mode ?? 'equal'
  const safeCustomPercentages = customPercentages ?? {}
  const safeTotal = totalPercentage ?? 0

  if (!normalizedRows.length) {
    return <p className="text-sm text-gray-500">No split preview available</p>
  }

  return (
    <div className="rounded-md bg-gray-50 p-3 space-y-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Split breakdown</p>
      {normalizedRows.map((row) => (
        <div key={row.userId} className="flex items-center justify-between py-1.5">
          <span className="text-sm">{row.name}</span>
          {safeMode === 'custom' ? (
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <input
                  type="number"
                  value={safeCustomPercentages[row.userId] ?? 0}
                  onChange={(event) => onCustomPercentageChange?.(row.userId, Number(event.target.value) || 0)}
                  className="w-16 text-right rounded border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`${row.name} percentage`}
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500">{formatCurrency(row.amountOwed)}</p>
            </div>
          ) : (
            <div className="text-sm font-medium tabular-nums">
              {formatCurrency(row.amountOwed)} <span className="text-xs text-gray-500 ml-1">({row.percentage.toFixed(0)}%)</span>
            </div>
          )}
        </div>
      ))}
      {safeMode === 'custom' && safeTotal !== 100 ? (
        <p className="text-sm text-red-600">Percentages must add up to 100% (currently {safeTotal}%).</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
