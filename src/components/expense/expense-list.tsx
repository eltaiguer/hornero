'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatRelativeExpenseDate } from '@/lib/formatting'

interface ExpenseListProps {
  expenses: Array<{
    id: string
    description: string
    amount: number
    date: string | Date
    category: { name: string; emoji?: string | null }
    payer: { name?: string | null }
  }>
  householdId?: string
  totalCount?: number
  nextPageHref?: string
}

export function ExpenseList({ expenses, householdId, totalCount, nextPageHref }: ExpenseListProps) {
  const router = useRouter()
  const safeHouseholdId = householdId ?? ''
  const safeTotalCount = totalCount ?? expenses.length
  const touchStartX = useRef<number | null>(null)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')

  async function handleDelete(expenseId: string) {
    if (!safeHouseholdId || deletingId) return
    if (!window.confirm('Delete this expense?')) return

    setDeletingId(expenseId)
    setStatusMessage('')

    try {
      const response = await fetch(`/api/households/${safeHouseholdId}/expenses/${expenseId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setRevealedId(null)
      setStatusMessage('Expense deleted')
      setTimeout(() => setStatusMessage(''), 2500)
      router.refresh()
    } catch {
      setStatusMessage('Could not delete expense')
    } finally {
      setDeletingId(null)
    }
  }

  if (!expenses.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">No expenses yet</p>
        <Link
          href={`/household/expenses/new?householdId=${safeHouseholdId}`}
          className="mt-3 inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Add your first expense
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{safeTotalCount} expenses</p>
      {statusMessage ? <p className="text-xs text-gray-500">{statusMessage}</p> : null}

      <ul className="space-y-3">
        {expenses.map((expense) => {
          const open = revealedId === expense.id
          const payerName = expense.payer.name?.split(' ')[0] ?? 'Unknown'

          return (
            <li
              key={expense.id}
              className="relative overflow-hidden group"
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null
              }}
              onTouchEnd={(event) => {
                const startX = touchStartX.current
                const endX = event.changedTouches[0]?.clientX ?? null
                if (startX === null || endX === null) return

                const delta = endX - startX
                if (delta < -40) {
                  setRevealedId(expense.id)
                } else if (delta > 40) {
                  setRevealedId(null)
                }
              }}
            >
              <div className="absolute inset-y-0 right-0 flex md:hidden">
                <Link
                  href={`/household/expenses/${expense.id}?householdId=${safeHouseholdId}`}
                  className="w-16 bg-blue-600 text-white text-xs font-medium flex items-center justify-center"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                  className="w-16 bg-red-600 text-white text-xs font-medium flex items-center justify-center disabled:opacity-50"
                >
                  {deletingId === expense.id ? '...' : 'Delete'}
                </button>
              </div>

              <div
                className="rounded-md border p-3 bg-white transition-transform"
                style={{ transform: open ? 'translateX(-8rem)' : 'translateX(0)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {expense.category.emoji ? `${expense.category.emoji} ` : ''}
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeExpenseDate(expense.date)} · {payerName} paid
                    </p>
                  </div>
                  <div className="text-sm font-semibold tabular-nums text-right">{formatCurrency(expense.amount)}</div>
                </div>

                <div className="mt-2 hidden md:flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                  <Link
                    href={`/household/expenses/${expense.id}?householdId=${safeHouseholdId}`}
                    className="rounded p-1.5 text-blue-600 hover:bg-blue-50 text-xs"
                    aria-label="Edit expense"
                  >
                    ✏️
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="rounded p-1.5 text-red-600 hover:bg-red-50 text-xs"
                    aria-label="Delete expense"
                  >
                    {deletingId === expense.id ? '…' : '🗑'}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {nextPageHref ? (
        <div className="pt-2 text-center">
          <Link href={nextPageHref} className="text-sm text-blue-600 font-medium">
            Load more...
          </Link>
        </div>
      ) : null}
    </div>
  )
}
