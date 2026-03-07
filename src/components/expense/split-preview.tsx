interface SplitPreviewProps {
  splits: Array<{ userId: string; name: string; amountOwed: number }>
}

export function SplitPreview({ splits }: SplitPreviewProps) {
  if (!splits.length) {
    return <p className="text-sm text-gray-500">No split preview available</p>
  }

  return (
    <ul className="space-y-1 rounded-md border p-3">
      {splits.map((split) => (
        <li key={split.userId} className="text-sm text-gray-700">
          {split.name} owes ${split.amountOwed.toFixed(2)}
        </li>
      ))}
    </ul>
  )
}
