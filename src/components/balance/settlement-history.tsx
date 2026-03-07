interface SettlementHistoryProps {
  items: Array<{
    id: string
    payer: { name?: string | null }
    receiver: { name?: string | null }
    amount: number
    date: string | Date
  }>
}

export function SettlementHistory({ items }: SettlementHistoryProps) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">No settlements yet.</p>
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="rounded-md border p-3 text-sm">
          <span>{item.payer.name ?? 'Unknown'} paid {item.receiver.name ?? 'Unknown'}</span>
          <span className="ml-2 font-semibold">${item.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  )
}
