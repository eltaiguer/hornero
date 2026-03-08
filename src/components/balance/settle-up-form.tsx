'use client'

import { useState } from 'react'
import type { CreateSettlementInput } from '@/lib/validations/settlement'
import { formatCurrency } from '@/lib/formatting'

interface SettleUpFormProps {
  receiverId?: string
  receiverName?: string
  defaultAmount?: number
  onSubmit: (input: CreateSettlementInput) => void | Promise<void>
  onCancel?: () => void
}

export function SettleUpForm({
  receiverId,
  receiverName,
  defaultAmount,
  onSubmit,
  onCancel,
}: SettleUpFormProps) {
  const [amount, setAmount] = useState((defaultAmount ?? 0).toFixed(2))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit({ receiverId: receiverId ?? '', amount: Number(amount), note: note || undefined })
      setSuccess(`Payment of ${formatCurrency(Number(amount))} recorded`)
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
      <p className="text-sm text-gray-500">Paying {receiverName ?? 'Member'}</p>

      <div>
        <label htmlFor="settle-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="settle-amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      <div>
        <label htmlFor="settle-note" className="block text-sm font-medium">Note (optional)</label>
        <textarea
          id="settle-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </div>

      {onCancel ? (
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline">
          Cancel
        </button>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Recording...' : 'Record Payment'}
      </button>

      {success ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">✓ {success}</p>
      ) : null}
    </form>
  )
}
