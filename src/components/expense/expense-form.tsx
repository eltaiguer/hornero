'use client'

import { useState } from 'react'
import type { CreateExpenseInput } from '@/lib/validations/expense'

interface ExpenseFormProps {
  categories: Array<{ id: string; name: string }>
  onSubmit: (data: CreateExpenseInput) => void | Promise<void>
}

export function ExpenseForm({ categories, onSubmit }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [splitMethod, setSplitMethod] = useState<'equal' | 'proportional' | 'custom'>('equal')
  const [splitConfig, setSplitConfig] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    await onSubmit({
      amount: Number(amount),
      description: description.trim(),
      date: new Date(date),
      categoryId,
      splitMethod,
      splitConfig: splitMethod === 'custom' ? splitConfig : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="expense-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="expense-description" className="block text-sm font-medium">Description</label>
        <input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium">Date</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-medium">Category</label>
        <select
          id="expense-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="split-method" className="block text-sm font-medium">Split method</label>
        <select
          id="split-method"
          value={splitMethod}
          onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'proportional' | 'custom')}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          <option value="equal">Equal</option>
          <option value="proportional">Proportional</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {splitMethod === 'custom' && (
        <div>
          <label htmlFor="split-config" className="block text-sm font-medium">Custom split config</label>
          <textarea
            id="split-config"
            value={splitConfig}
            onChange={(e) => setSplitConfig(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            placeholder='{"user-1": 60, "user-2": 40}'
          />
        </div>
      )}

      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Save expense
      </button>
    </form>
  )
}
