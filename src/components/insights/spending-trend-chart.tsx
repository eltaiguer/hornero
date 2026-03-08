'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/formatting'

interface SpendingTrendChartProps {
  data: Array<{ month: string; total: number }>
}

function monthLabel(value: string) {
  const [year, month] = value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleString('en-US', { month: 'short' })
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  const [range, setRange] = useState<6 | 12>(6)
  const visible = useMemo(() => data.slice(-range), [data, range])

  if (!visible.length) {
    return <div className="rounded-md border p-4 text-sm text-gray-400 text-center">Not enough data to display</div>
  }

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Spending Trend</h3>
        <div className="space-x-2 text-xs">
          <button type="button" className={range === 6 ? 'text-blue-600 font-medium' : 'text-gray-500'} onClick={() => setRange(6)}>6M</button>
          <button type="button" className={range === 12 ? 'text-blue-600 font-medium' : 'text-gray-500'} onClick={() => setRange(12)}>12M</button>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible}>
            <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value: number) => formatCurrency(Number(value))}
              labelFormatter={(value) => String(value)}
            />
            <Area dataKey="total" stroke="none" fill="#2563eb" fillOpacity={0.1} />
            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 md:grid-cols-3">
        {visible.map((point) => (
          <p key={point.month}>{point.month}: {formatCurrency(point.total)}</p>
        ))}
      </div>
    </div>
  )
}
