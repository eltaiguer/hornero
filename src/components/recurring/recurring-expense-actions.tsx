interface RecurringExpenseActionsProps {
  active: boolean
  onEdit: () => void | Promise<void>
  onPause: () => void | Promise<void>
  onResume: () => void | Promise<void>
  onDelete: () => void | Promise<void>
}

export function RecurringExpenseActions({
  active,
  onEdit,
  onPause,
  onResume,
  onDelete,
}: RecurringExpenseActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      {active ? (
        <button type="button" onClick={onPause} className="rounded p-1.5 hover:bg-gray-100 text-gray-500" aria-label="Pause recurring expense">
          ⏸
        </button>
      ) : (
        <button type="button" onClick={onResume} className="rounded p-1.5 hover:bg-gray-100 text-gray-500" aria-label="Resume recurring expense">
          ▶
        </button>
      )}
      <button type="button" onClick={onEdit} className="rounded p-1.5 hover:bg-blue-50 text-blue-600" aria-label="Edit recurring expense">
        ✏️
      </button>
      <button type="button" onClick={onDelete} className="rounded p-1.5 hover:bg-red-50 text-red-600" aria-label="Delete recurring expense">
        🗑
      </button>
    </div>
  )
}
