interface MemberBreakdownChartProps {
  data: Array<{ userId: string; name: string; amount: number }>
}

export function MemberBreakdownChart({ data }: MemberBreakdownChartProps) {
  return (
    <ul className="space-y-2 rounded-md border p-4 text-sm">
      {data.map((item) => (
        <li key={item.userId}>
          {item.name}: ${item.amount.toFixed(2)}
        </li>
      ))}
    </ul>
  )
}
