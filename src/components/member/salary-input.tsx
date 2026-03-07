'use client'

import { useState } from 'react'

interface Props {
  currentSalary: number | null
  onSave: (salary: number | null, effectiveFrom: string) => void | Promise<void>
  currency: string
}

export function SalaryInput({ currentSalary, onSave, currency }: Props) {
  const [value, setValue] = useState(currentSalary?.toString() ?? '')
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const numericValue = value === '' ? null : Number(value)
      await onSave(numericValue, effectiveFrom)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-sm font-medium text-gray-500 sm:w-12">{currency}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter net monthly salary"
        className="block w-full rounded-md border px-3 py-2"
      />
      <input
        type="date"
        value={effectiveFrom}
        onChange={(e) => setEffectiveFrom(e.target.value)}
        className="block rounded-md border px-3 py-2"
        aria-label="Salary effective date"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Save'}
      </button>
    </div>
  )
}
