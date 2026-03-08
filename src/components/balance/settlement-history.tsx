import { formatCurrency, formatShortDateLabel } from '@/lib/formatting'

interface SettlementHistoryProps {
  items: Array<{
    id: string
    payer: { name?: string | null }
    receiver: { name?: string | null }
    amount: number
    date: string | Date
    note?: string | null
  }>
}

export function SettlementHistory({ items }: SettlementHistoryProps) {
  if (!items.length) {
    return <p className="text-sm text-gray-500 text-center">No settlements yet</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border p-3 space-y-1">
          <p className="text-xs text-gray-500">
            {formatShortDateLabel(item.date)} · {item.payer.name ?? 'Unknown'} → {item.receiver.name ?? 'Unknown'}
          </p>
          <p className="text-sm font-semibold tabular-nums">{formatCurrency(item.amount)}</p>
          {item.note ? <p className="text-xs text-gray-500 italic">&quot;{item.note}&quot;</p> : null}
        </li>
      ))}
    </ul>
  )
}
