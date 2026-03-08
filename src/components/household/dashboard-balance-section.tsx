import Link from 'next/link'
import { formatCurrency } from '@/lib/formatting'

interface Debt {
  fromName: string
  toName: string
  amount: number
}

interface DashboardBalanceSectionProps {
  debts: Debt[]
  allSettled: boolean
  householdId: string
}

export function DashboardBalanceSection({
  debts,
  allSettled,
  householdId,
}: DashboardBalanceSectionProps) {
  const balancesHref = `/household/balances?householdId=${householdId}`

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Balances</h2>
        <Link href={balancesHref} className="text-sm text-blue-600 hover:underline">
          View all
        </Link>
      </div>

      {allSettled ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center text-green-700 font-medium">
          All settled up!
        </div>
      ) : (
        <div className="rounded-md border p-4 space-y-2">
          {debts.slice(0, 3).map((debt, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                <span className="font-medium">{debt.fromName}</span>
                <span className="text-gray-400 mx-1">&rarr;</span>
                <span className="font-medium">{debt.toName}</span>
              </span>
              <span className="font-medium text-red-600 tabular-nums">
                {formatCurrency(debt.amount)}
              </span>
            </div>
          ))}
          {debts.length > 3 && (
            <Link href={balancesHref} className="block text-xs text-gray-500 hover:underline">
              +{debts.length - 3} more
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
