interface BalanceCardProps {
  name: string
  balance: number
}

export function BalanceCard({ name, balance }: BalanceCardProps) {
  const positive = balance >= 0

  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-gray-600">{name}</p>
      <p className={positive ? 'text-lg font-semibold text-green-600' : 'text-lg font-semibold text-red-600'}>
        ${Math.abs(balance).toFixed(2)}
      </p>
      <p className="text-xs text-gray-500">{positive ? 'is owed' : 'owes'}</p>
    </div>
  )
}
