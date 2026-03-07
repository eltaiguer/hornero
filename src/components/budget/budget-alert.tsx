interface BudgetAlertProps {
  alerts: Array<{
    categoryName: string
    percentage: number
    level: 'warning' | 'danger'
  }>
}

export function BudgetAlert({ alerts }: BudgetAlertProps) {
  if (!alerts.length) {
    return null
  }

  return (
    <ul className="space-y-2">
      {alerts.map((alert, index) => (
        <li key={`${alert.categoryName}-${index}`} className="rounded-md border p-3 text-sm">
          <span>{alert.categoryName}</span>
          <span className="ml-2">{alert.percentage}%</span>
          <span className="ml-2 font-medium">{alert.level === 'danger' ? 'Over budget' : 'Near limit'}</span>
        </li>
      ))}
    </ul>
  )
}
