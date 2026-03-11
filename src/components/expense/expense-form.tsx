'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CreateExpenseInput } from '@/lib/validations/expense'
import { formatCurrency, formatDateForInput } from '@/lib/formatting'
import { calculateSplits } from '@/services/split.service'
import { SplitPreview } from './split-preview'
import { ReceiptUploadForm } from './receipt-upload-form'

type SplitMethod = 'equal' | 'proportional' | 'custom'

interface CategoryOption {
  id: string
  name: string
  emoji?: string | null
  isDefault?: boolean
}

interface ExpenseFormProps {
  categories: CategoryOption[]
  members?: Array<{ id: string; name: string; salary?: number | null }>
  initialValues?: Partial<CreateExpenseInput>
  expenseId?: string
  receiptUrl?: string
  submitLabel?: string
  onDelete?: () => void | Promise<void>
  onSubmitWithReceipt?: (data: CreateExpenseInput, file: File | null) => void | Promise<void>
  onSubmit: (data: CreateExpenseInput) => void | Promise<void>
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

export function ExpenseForm({
  categories,
  members = [],
  initialValues,
  expenseId,
  receiptUrl,
  submitLabel = 'Save Expense',
  onDelete,
  onSubmitWithReceipt,
  onSubmit,
}: ExpenseFormProps) {
  const today = formatDateForInput(new Date())
  const [amount, setAmount] = useState(initialValues?.amount?.toString() ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [date, setDate] = useState(initialValues?.date ? formatDateForInput(new Date(initialValues.date)) : today)
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? '')
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(initialValues?.splitMethod ?? 'equal')
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const createReceiptInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingReceiptFile, setPendingReceiptFile] = useState<File | null>(null)
  const [pendingReceiptPreview, setPendingReceiptPreview] = useState('')

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

  useEffect(() => {
    return () => {
      if (pendingReceiptPreview) {
        URL.revokeObjectURL(pendingReceiptPreview)
      }
    }
  }, [pendingReceiptPreview])

  const splitPreview = useMemo(() => {
    if (!members.length || !amount || !date) {
      return {
        error: '',
        rows: [] as Array<{ userId: string; name: string; amountOwed: number; percentage: number }>,
      }
    }

    try {
      const splitConfig = JSON.stringify(customPercentages)
      const calculated = calculateSplits(
        Number(amount),
        splitMethod,
        members.map((member) => ({ userId: member.id, salary: member.salary ?? null })),
        splitMethod === 'custom' ? splitConfig : undefined
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
  }, [amount, date, members, customPercentages, splitMethod])

  const customTotal = Object.values(customPercentages).reduce((sum, value) => sum + value, 0)

  const defaultCategories = categories.filter((category) => category.isDefault)
  const customCategories = categories.filter((category) => !category.isDefault)
  const visibleDefaults = defaultCategories.length ? defaultCategories : categories

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)

    try {
      const payload: CreateExpenseInput = {
        amount: Number(amount),
        description: description.trim(),
        date: new Date(date),
        categoryId,
        splitMethod,
        splitConfig: splitMethod === 'custom' ? JSON.stringify(customPercentages) : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      }

      if (onSubmitWithReceipt) {
        await onSubmitWithReceipt(payload, pendingReceiptFile)
      } else {
        await onSubmit(payload)
      }
    } finally {
      setSaving(false)
    }
  }

  function handleCreateReceiptChange(file: File | null) {
    setPendingReceiptFile(file)
    setPendingReceiptPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }
      return file ? URL.createObjectURL(file) : ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border p-4 space-y-4">
      <div>
        <label htmlFor="expense-amount" className="block text-sm font-medium">Amount</label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full rounded-md border px-3 py-2 pl-7 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="expense-description" className="block text-sm font-medium">Description</label>
        <input
          id="expense-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          required
        />
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-medium">Date</label>
        <input
          id="expense-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          required
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-medium">Category</label>
        <select
          id="expense-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {visibleDefaults.map((category) => (
            <option key={category.id} value={category.id}>
              {`${category.emoji ?? '📁'} ${category.name}`}
            </option>
          ))}
          {defaultCategories.length > 0 && customCategories.length > 0 ? (
            <optgroup label="Custom">
              {customCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {`${category.emoji ?? '📁'} ${category.name}`}
                </option>
              ))}
            </optgroup>
          ) : null}
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
                } focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
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
        <label htmlFor="expense-notes" className="block text-sm font-medium">Notes (optional)</label>
        <textarea
          id="expense-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Receipt Photo</label>
        {expenseId ? (
          <ReceiptUploadForm expenseId={expenseId} existingUrl={receiptUrl} />
        ) : (
          <div className="space-y-2">
            <input
              ref={createReceiptInputRef}
              type="file"
              name="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                handleCreateReceiptChange(file)
              }}
            />
            {pendingReceiptPreview ? (
              <div className="relative rounded-md overflow-hidden border">
                <Image
                  src={pendingReceiptPreview}
                  alt="Receipt preview"
                  width={1200}
                  height={1600}
                  className="max-h-48 object-cover w-full"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => {
                    handleCreateReceiptChange(null)
                    if (createReceiptInputRef.current) {
                      createReceiptInputRef.current.value = ''
                    }
                  }}
                  className="absolute top-1 right-1 rounded-full bg-black/50 text-white w-6 h-6 flex items-center justify-center"
                  aria-label="Remove pending receipt"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => createReceiptInputRef.current?.click()}
                className="w-full rounded-md border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
              >
                <p className="text-sm text-gray-500">📷 Add receipt photo</p>
                <p className="text-xs text-gray-400">Tap to take photo or choose file</p>
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={saving || (splitMethod === 'custom' && customTotal !== 100)}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : submitLabel}
      </button>

      {onDelete ? (
        <button
          type="button"
          onClick={() => void onDelete()}
          className="w-full rounded-md border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Delete
        </button>
      ) : null}

      {splitPreview.rows.length > 0 && splitMethod !== 'custom' ? (
        <p className="text-xs text-gray-500">Total: {formatCurrency(Number(amount || 0))}</p>
      ) : null}
    </form>
  )
}
