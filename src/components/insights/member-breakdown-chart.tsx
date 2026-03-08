'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/formatting'

interface MemberBreakdownChartProps {
  data: Array<{ userId: string; name: string; amount: number }>
}

export function MemberBreakdownChart({ data }: MemberBreakdownChartProps) {
  if (!data.length) {
    return <div className="rounded-md border p-4 text-sm text-gray-400 text-center">Not enough data to display</div>
  }

  const height = Math.max(120, data.length * 44)

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-sm font-semibold mb-3">By Member</h3>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
            <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
            <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">{data.map((item) => `${item.name} ${formatCurrency(item.amount)}`).join(', ')}</div>
    </div>
  )
}
