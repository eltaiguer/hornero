interface SimplifiedDebtsProps {
  debts: Array<{ fromName: string; toName: string; amount: number }>
}

export function SimplifiedDebts({ debts }: SimplifiedDebtsProps) {
  if (!debts.length) {
    return <p className="text-sm text-gray-500">All settled up.</p>
  }

  return (
    <ul className="space-y-2">
      {debts.map((debt, index) => (
        <li key={`${debt.fromName}-${debt.toName}-${index}`} className="rounded-md border p-3 text-sm">
          <span>{debt.fromName} pays {debt.toName}</span>
          <span className="ml-2 font-semibold">${debt.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  )
}
