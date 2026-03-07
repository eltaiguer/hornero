'use client'

import { useState } from 'react'

interface ExportButtonProps {
  onExport: (input: { from: string; to: string }) => void | Promise<void>
}

export function ExportButton({ onExport }: ExportButtonProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  async function handleExport() {
    await onExport({ from, to })
  }

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div>
        <label htmlFor="export-from" className="block text-sm font-medium">From</label>
        <input
          id="export-from"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <div>
        <label htmlFor="export-to" className="block text-sm font-medium">To</label>
        <input
          id="export-to"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </div>
      <button type="button" onClick={handleExport} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Export CSV
      </button>
    </div>
  )
}
