interface RecurringExpenseActionsProps {
  active: boolean
  onPause: () => void | Promise<void>
  onResume: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}

export function RecurringExpenseActions({
  active,
  onPause,
  onResume,
  onDelete,
}: RecurringExpenseActionsProps) {
  return (
    <div className="flex gap-2">
      {active ? (
        <button type="button" onClick={onPause} className="rounded-md border px-3 py-1 text-sm">
          Pause
        </button>
      ) : (
        <button type="button" onClick={onResume} className="rounded-md border px-3 py-1 text-sm">
          Resume
        </button>
      )}
      <button type="button" onClick={onDelete} className="rounded-md border px-3 py-1 text-sm text-red-600">
        Delete
      </button>
    </div>
  )
}
