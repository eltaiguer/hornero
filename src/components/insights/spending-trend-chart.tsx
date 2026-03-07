interface SpendingTrendChartProps {
  data: Array<{ month: string; total: number }>
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <ul className="space-y-2 rounded-md border p-4 text-sm">
      {data.map((point) => (
        <li key={point.month}>
          {point.month}: ${point.total.toFixed(2)}
        </li>
      ))}
    </ul>
  )
}
