'use client'

import { useState } from 'react'
import type { CreateSettlementInput } from '@/lib/validations/settlement'

interface SettleUpFormProps {
  members: Array<{ id: string; name: string }>
  onSubmit: (input: CreateSettlementInput) => void | Promise<void>
}

export function SettleUpForm({ members, onSubmit }: SettleUpFormProps) {
  const [receiverId, setReceiverId] = useState(members[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    await onSubmit({ receiverId, amount: Number(amount), note: note || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border p-4">
      <div>
        <label htmlFor="settle-receiver" className="block text-sm font-medium">Receiver</label>
        <select
          id="settle-receiver"
          value={receiverId}
          onChange={(e) => setReceiverId(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="settle-amount" className="block text-sm font-medium">Amount</label>
        <input
          id="settle-amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="settle-note" className="block text-sm font-medium">Note</label>
        <input
          id="settle-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>

      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Record payment
      </button>
    </form>
  )
}
