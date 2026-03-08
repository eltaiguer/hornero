'use client'

import { useState } from 'react'

export interface ExpenseFiltersValue {
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  payerId?: string
  minAmount?: string
  maxAmount?: string
}

interface ExpenseFiltersProps {
  categories: Array<{ id: string; name: string; emoji?: string | null }>
  members: Array<{ id: string; name: string }>
  initialValue?: ExpenseFiltersValue
  onApply: (filters: ExpenseFiltersValue) => void
}

function countActiveFilters(value: ExpenseFiltersValue) {
  return Object.values(value).filter((item) => Boolean(item)).length
}

export function ExpenseFilters({ categories, members, initialValue, onApply }: ExpenseFiltersProps) {
  const safeInitialValue = initialValue ?? {}
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<ExpenseFiltersValue>(safeInitialValue)

  const activeFilters = countActiveFilters(safeInitialValue)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {activeFilters > 0 ? `Filtered (${activeFilters})` : 'Filter ↓'}
        </button>
      </div>

      {open ? (
        <div className="rounded-md border bg-gray-50 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-from" className="block text-sm font-medium">From</label>
              <input
                id="filter-from"
                type="date"
                value={value.dateFrom ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, dateFrom: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="filter-to" className="block text-sm font-medium">To</label>
              <input
                id="filter-to"
                type="date"
                value={value.dateTo ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, dateTo: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium">Category</label>
              <select
                id="filter-category"
                value={value.categoryId ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, categoryId: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {`${category.emoji ?? '📁'} ${category.name}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-payer" className="block text-sm font-medium">Paid by</label>
              <select
                id="filter-payer"
                value={value.payerId ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, payerId: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <option value="">All</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-min" className="block text-sm font-medium">Min $</label>
              <input
                id="filter-min"
                type="number"
                min="0"
                step="0.01"
                value={value.minAmount ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, minAmount: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="filter-max" className="block text-sm font-medium">Max $</label>
              <input
                id="filter-max"
                type="number"
                min="0"
                step="0.01"
                value={value.maxAmount ?? ''}
                onChange={(event) => setValue((current) => ({ ...current, maxAmount: event.target.value || undefined }))}
                className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                const emptyValue: ExpenseFiltersValue = {}
                setValue(emptyValue)
                onApply(emptyValue)
              }}
              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply(value)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
