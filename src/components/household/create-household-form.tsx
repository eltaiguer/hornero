'use client'

import { useState } from 'react'
import { SUPPORTED_CURRENCIES } from '@/lib/validations/household'
import type { CreateHouseholdInput } from '@/lib/validations/household'

interface Props {
  onSubmit: (data: CreateHouseholdInput) => void | Promise<void>
}

export function CreateHouseholdForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState<CreateHouseholdInput['currency']>('USD')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)
    try {
      await onSubmit({ name: name.trim(), currency })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="household-name" className="block text-sm font-medium">
          Household name
        </label>
        <input
          id="household-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border px-3 py-2"
          placeholder="e.g. The Garcia Family"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium">
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => {
            const next = SUPPORTED_CURRENCIES.find((item) => item === e.target.value)
            if (next) {
              setCurrency(next)
            }
          }}
          className="mt-1 block w-full rounded-md border px-3 py-2"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create household'}
      </button>
    </form>
  )
}
