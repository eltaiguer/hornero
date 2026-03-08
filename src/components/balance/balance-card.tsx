import { clamp, formatCurrency } from '@/lib/formatting'

interface BalanceCardProps {
  name: string
  balance: number
  maxAbsBalance?: number
}

export function BalanceCard({ name, balance, maxAbsBalance = Math.abs(balance) || 1 }: BalanceCardProps) {
  const isPositive = balance > 0
  const isNegative = balance < 0

  const label = isPositive ? 'You are owed' : isNegative ? 'You owe' : 'Settled up'
  const amountClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
  const percentage = clamp((Math.abs(balance) / maxAbsBalance) * 100, 0, 100)

  return (
    <div className="rounded-md border p-4 space-y-2">
      <p className="text-sm font-medium">{name}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${amountClass}`}>{formatCurrency(balance)}</p>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${isNegative ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
