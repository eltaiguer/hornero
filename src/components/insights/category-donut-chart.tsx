'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatting'

interface CategoryDonutChartProps {
  data: Array<{ category: string; amount: number; percentage: number; color?: string; emoji?: string }>
}

const FALLBACK_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6b7280']

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  if (!data.length) {
    return <div className="rounded-md border p-4 text-sm text-gray-400 text-center">Not enough data to display</div>
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-sm font-semibold mb-3">By Category</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius={50}
              outerRadius={80}
              cx="50%"
              cy="50%"
            >
              {data.map((item, index) => (
                <Cell key={`${item.category}-${index}`} fill={item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-xs font-semibold tabular-nums -mt-2 mb-2">{formatCurrency(total)}</div>

      <ul className="w-full flex flex-wrap gap-2 text-xs">
        {data.map((item, index) => (
          <li key={item.category} className="flex items-center gap-1 rounded border px-2 py-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] }}
            />
            <span>{item.emoji ?? '📁'} {item.category}</span>
            <span className="tabular-nums">{formatCurrency(item.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
