'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { formatDateForInput } from '@/lib/formatting'
import type { CreateRecurringExpenseInput } from '@/lib/validations/recurring'
import { calculateSplits } from '@/services/split.service'
import { SplitPreview } from '@/components/expense/split-preview'

type SplitMethod = CreateRecurringExpenseInput['splitMethod']
type Frequency = CreateRecurringExpenseInput['frequency']

interface RecurringExpenseFormProps {
  categories: Array<{ id: string; name: string; emoji?: string | null }>
  members?: Array<{ id: string; name: string; salary?: number | null }>
  initialValues?: Partial<CreateRecurringExpenseInput>
  submitLabel?: string
  cancelHref?: string
  onSubmit: (input: CreateRecurringExpenseInput) => void | Promise<void>
}

function parseInitialCustomConfig(splitConfig: string | undefined, memberIds: string[]) {
  if (!splitConfig) return Object.fromEntries(memberIds.map((id) => [id, 0]))

  try {
    const parsed = JSON.parse(splitConfig) as Record<string, number>
    return Object.fromEntries(memberIds.map((id) => [id, parsed[id] ?? 0]))
  } catch {
    return Object.fromEntries(memberIds.map((id) => [id, 0]))
  }
}

export function RecurringExpenseForm({
  categories,
  members = [],
  initialValues,
  submitLabel = 'Create Recurring Expense',
  cancelHref,
  onSubmit,
}: RecurringExpenseFormProps) {
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(initialValues?.splitMethod ?? 'equal')
  const [frequency, setFrequency] = useState<Frequency>(initialValues?.frequency ?? 'monthly')
  const [startDate, setStartDate] = useState(
    initialValues?.startDate ? formatDateForInput(new Date(initialValues.startDate)) : formatDateForInput(new Date())
  )
  const [endDate, setEndDate] = useState(
    initialValues?.endDate ? formatDateForInput(new Date(initialValues.endDate)) : ''
  )
  const [submitting, setSubmitting] = useState(false)
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>(() =>
    parseInitialCustomConfig(initialValues?.splitConfig, members.map((member) => member.id))
  )

  useEffect(() => {
    if (!members.length) return
    setCustomPercentages((current) => {
      const next: Record<string, number> = {}
      for (const member of members) {
        next[member.id] = current[member.id] ?? Math.floor(100 / members.length)
      }
      return next
    })
  }, [members])

  const splitPreview = useMemo(() => {
    if (!members.length || !amount) {
      return {
        error: '',
        rows: [] as Array<{ userId: string; name: string; amountOwed: number; percentage: number }>,
      }
    }

    try {
      const calculated = calculateSplits(
        Number(amount),
        splitMethod,
        members.map((member) => ({ userId: member.id, salary: member.salary ?? null })),
        splitMethod === 'custom' ? JSON.stringify(customPercentages) : undefined
      )

      return {
        error: '',
        rows: calculated.map((split) => ({
          userId: split.userId,
          name: members.find((member) => member.id === split.userId)?.name ?? split.userId,
          amountOwed: split.amountOwed,
          percentage: Number(amount) > 0 ? (split.amountOwed / Number(amount)) * 100 : 0,
        })),
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unable to preview split',
        rows: [] as Array<{ userId: string; name: string; amountOwed: number; percentage: number }>,
      }
    }
  }, [amount, customPercentages, members, splitMethod])

  const customTotal = Object.values(customPercentages).reduce((sum, value) => sum + value, 0)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit({
        amount: Number(amount),
        description: description.trim(),
        categoryId,
        splitMethod,
        splitConfig: splitMethod === 'custom' ? JSON.stringify(customPercentages) : undefined,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border p-4 space-y-4">
      <h2 className="text-base font-semibold">{submitLabel === 'Create Recurring Expense' ? 'New Recurring Expense' : 'Edit Recurring Expense'}</h2>

      <div>
        <label htmlFor="rec-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="rec-amount"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div>
        <label htmlFor="rec-description" className="block text-sm font-medium">Description</label>
        <input
          id="rec-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div>
        <label htmlFor="rec-category" className="block text-sm font-medium">Category</label>
        <select
          id="rec-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{`${category.emoji ?? '📁'} ${category.name}`}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Split Method</label>
        <div className="mt-1 flex rounded-md border overflow-hidden">
          {[
            { id: 'equal', label: 'Equal' },
            { id: 'proportional', label: 'By Income' },
            { id: 'custom', label: 'Custom' },
          ].map((option) => {
            const active = splitMethod === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSplitMethod(option.id as SplitMethod)}
                className={`flex-1 px-3 py-2 text-sm font-medium text-center ${
                  active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {amount ? (
        <SplitPreview
          rows={splitPreview.rows}
          mode={splitMethod}
          customPercentages={customPercentages}
          onCustomPercentageChange={(userId, percentage) => {
            setCustomPercentages((current) => ({ ...current, [userId]: percentage }))
          }}
          totalPercentage={customTotal}
          error={splitPreview.error}
        />
      ) : null}

      <div>
        <label htmlFor="rec-frequency" className="block text-sm font-medium">Frequency</label>
        <select
          id="rec-frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as Frequency)}
          className="sr-only"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <div className="mt-1 flex rounded-md border overflow-hidden">
          {[
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
          ].map((option) => {
            const active = frequency === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFrequency(option.id as Frequency)}
                className={`flex-1 px-3 py-2 text-sm font-medium text-center ${
                  active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="rec-start-date" className="block text-sm font-medium">Starts on</label>
        <input
          id="rec-start-date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div>
        <label htmlFor="rec-end-date" className="block text-sm font-medium">Ends on (optional)</label>
        <input
          id="rec-end-date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
        {!endDate ? <p className="text-xs text-gray-500 mt-1">Runs indefinitely</p> : null}
      </div>

      {cancelHref ? (
        <Link href={cancelHref} className="text-sm text-gray-600 hover:underline">
          Cancel
        </Link>
      ) : null}

      <button
        type="submit"
        disabled={submitting || (splitMethod === 'custom' && customTotal !== 100)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
