'use client'

import { useState } from 'react'
import type { CreateBudgetInput } from '@/lib/validations/budget'

interface BudgetFormProps {
  categories: Array<{ id: string; name: string }>
  onSubmit: (input: CreateBudgetInput) => void | Promise<void>
}

export function BudgetForm({ categories, onSubmit }: BudgetFormProps) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    await onSubmit({
      categoryId,
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
      <div>
        <label htmlFor="budget-category" className="block text-sm font-medium">Category</label>
        <select
          id="budget-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="budget-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="budget-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label htmlFor="budget-month" className="block text-sm font-medium">Month</label>
          <input
            id="budget-month"
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="budget-year" className="block text-sm font-medium">Year</label>
          <input
            id="budget-year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>
      </div>

      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save budget
      </button>
    </form>
  )
}
