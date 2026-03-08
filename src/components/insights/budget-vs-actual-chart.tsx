'use client'

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/formatting'

interface BudgetVsActualChartProps {
  data: Array<{ category: string; budget: number; actual: number; color?: string; emoji?: string }>
}

export function BudgetVsActualChart({ data }: BudgetVsActualChartProps) {
  if (!data.length) {
    return <div className="rounded-md border p-4 text-sm text-gray-400 text-center">Not enough data to display</div>
  }

  const normalized = data.map((item) => ({ ...item, label: `${item.emoji ?? '📁'} ${item.category}` }))

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-sm font-semibold mb-3">Budget vs Actual</h3>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalized}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="budget" fill="#d1d5db" name="Budget" />
            <Bar dataKey="actual" fill="#2563eb" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-gray-500 mt-2 space-y-1">
        {data.map((item) => (
          <p key={item.category}>{item.category}: {formatCurrency(item.budget)} / {formatCurrency(item.actual)}</p>
        ))}
      </div>
    </div>
  )
}
