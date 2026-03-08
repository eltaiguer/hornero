'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatMonthYear } from '@/lib/formatting'
import type { CreateBudgetInput } from '@/lib/validations/budget'

interface BudgetFormProps {
  categories: Array<{ id: string; name: string; emoji?: string | null }>
  usedCategoryIds: string[]
  month: number
  year: number
  onMonthChange?: (month: number, year: number) => void
  previousMonthHref?: string
  nextMonthHref?: string
  editingBudget?: { id: string; categoryId: string; amount: number }
  cancelEditHref?: string
  onDelete?: (budgetId: string) => void | Promise<void>
  onSubmit: (input: CreateBudgetInput) => void | Promise<void>
}

function toDate(month: number, year: number) {
  return new Date(year, month - 1, 1)
}

export function BudgetForm({
  categories,
  usedCategoryIds,
  month,
  year,
  onMonthChange,
  previousMonthHref,
  nextMonthHref,
  editingBudget,
  cancelEditHref,
  onDelete,
  onSubmit,
}: BudgetFormProps) {

  const available = useMemo(
    () => {
      if (!editingBudget) {
        return categories.filter((category) => !usedCategoryIds.includes(category.id))
      }
      return categories.filter((category) => !usedCategoryIds.includes(category.id) || category.id === editingBudget.categoryId)
    },
    [categories, usedCategoryIds, editingBudget]
  )

  const [categoryId, setCategoryId] = useState(editingBudget?.categoryId ?? available[0]?.id ?? categories[0]?.id ?? '')
  const [amount, setAmount] = useState(editingBudget ? editingBudget.amount.toString() : '')
  const [submitting, setSubmitting] = useState(false)

  const displayDate = toDate(month, year)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!categoryId) return
    setSubmitting(true)

    try {
      await onSubmit({
        categoryId,
        amount: Number(amount),
        month,
        year,
      })
      if (!editingBudget) {
        setAmount('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-center gap-2">
        {previousMonthHref ? (
          <Link href={previousMonthHref} className="rounded p-1 hover:bg-gray-100 text-gray-600" aria-label="Previous month">◀</Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              const date = new Date(year, month - 2, 1)
              onMonthChange?.(date.getMonth() + 1, date.getFullYear())
            }}
            className="rounded p-1 hover:bg-gray-100 text-gray-600"
            aria-label="Previous month"
          >
            ◀
          </button>
        )}
        <p className="text-base font-semibold">{formatMonthYear(displayDate)}</p>
        {nextMonthHref ? (
          <Link href={nextMonthHref} className="rounded p-1 hover:bg-gray-100 text-gray-600" aria-label="Next month">▶</Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              const date = new Date(year, month, 1)
              onMonthChange?.(date.getMonth() + 1, date.getFullYear())
            }}
            className="rounded p-1 hover:bg-gray-100 text-gray-600"
            aria-label="Next month"
          >
            ▶
          </button>
        )}
      </div>

      <div>
        <label htmlFor="budget-category" className="block text-sm font-medium">Category</label>
        <select
          id="budget-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {available.length === 0 ? <option value="">No categories left for this month</option> : null}
          {available.map((category) => (
            <option key={category.id} value={category.id}>{`${category.emoji ?? '📁'} ${category.name}`}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="budget-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="budget-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !categoryId}
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}
      </button>

      {editingBudget && onDelete ? (
        <div className="flex items-center justify-between">
          {cancelEditHref ? <Link href={cancelEditHref} className="text-sm text-gray-600 hover:underline">Cancel</Link> : <span />}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Remove this budget?')) {
                void onDelete(editingBudget.id)
              }
            }}
            className="text-sm font-medium text-red-700 hover:underline"
          >
            Remove Budget
          </button>
        </div>
      ) : null}
    </form>
  )
}
