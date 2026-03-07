'use client'

import { useState } from 'react'
import type { CreateRecurringExpenseInput } from '@/lib/validations/recurring'

interface RecurringExpenseFormProps {
  categories: Array<{ id: string; name: string }>
  onSubmit: (input: CreateRecurringExpenseInput) => void | Promise<void>
}

export function RecurringExpenseForm({ categories, onSubmit }: RecurringExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [splitMethod, setSplitMethod] = useState<'equal' | 'proportional' | 'custom'>('equal')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    await onSubmit({
      amount: Number(amount),
      description: description.trim(),
      categoryId,
      splitMethod,
      splitConfig: undefined,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
      <div>
        <label htmlFor="rec-amount" className="block text-sm font-medium">Amount</label>
        <input id="rec-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label htmlFor="rec-description" className="block text-sm font-medium">Description</label>
        <input id="rec-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label htmlFor="rec-category" className="block text-sm font-medium">Category</label>
        <select id="rec-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2">
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="rec-split" className="block text-sm font-medium">Split method</label>
        <select id="rec-split" value={splitMethod} onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'proportional' | 'custom')} className="mt-1 w-full rounded-md border px-3 py-2">
          <option value="equal">equal</option>
          <option value="proportional">proportional</option>
          <option value="custom">custom</option>
        </select>
      </div>

      <div>
        <label htmlFor="rec-frequency" className="block text-sm font-medium">Frequency</label>
        <select id="rec-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')} className="mt-1 w-full rounded-md border px-3 py-2">
          <option value="daily">daily</option>
          <option value="weekly">weekly</option>
          <option value="monthly">monthly</option>
          <option value="yearly">yearly</option>
        </select>
      </div>

      <div>
        <label htmlFor="rec-start-date" className="block text-sm font-medium">Start date</label>
        <input id="rec-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <div>
        <label htmlFor="rec-end-date" className="block text-sm font-medium">End date</label>
        <input id="rec-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2" />
      </div>

      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Save recurring expense</button>
    </form>
  )
}
