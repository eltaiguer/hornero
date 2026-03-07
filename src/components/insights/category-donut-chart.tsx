interface CategoryDonutChartProps {
  data: Array<{ category: string; amount: number; percentage: number }>
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  return (
    <ul className="space-y-2 rounded-md border p-4 text-sm">
      {data.map((item) => (
        <li key={item.category}>
          {item.category}: ${item.amount.toFixed(2)} ({item.percentage}%)
        </li>
      ))}
    </ul>
  )
}
