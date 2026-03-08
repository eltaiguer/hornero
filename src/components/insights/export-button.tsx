'use client'

import { useMemo, useState } from 'react'
import { formatDateForInput } from '@/lib/formatting'

interface ExportButtonProps {
  householdId?: string
  onExport?: (input: { from: string; to: string }) => void | Promise<void>
}

function getDefaultRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: formatDateForInput(start),
    to: formatDateForInput(end),
  }
}

export function ExportButton({ householdId, onExport }: ExportButtonProps) {
  const defaults = useMemo(() => getDefaultRange(), [])
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  async function handleExport() {
    setError('')
    setDownloading(true)

    try {
      if (onExport) {
        await onExport({ from, to })
        return
      }
      if (!householdId || !from || !to) {
        setError('Select date range before exporting.')
        return
      }

      const response = await fetch(
        `/api/households/${householdId}/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      if (!response.ok) {
        setError('Export failed')
        return
      }

      const csv = await response.text()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `expenses-${from}-to-${to}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="export-from" className="block text-sm font-medium">From</label>
          <input
            id="export-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="export-to" className="block text-sm font-medium">To</label>
          <input
            id="export-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          />
        </div>
      </div>
      <button type="button" aria-label="Export CSV" onClick={handleExport} className="rounded-md border px-4 py-3 text-sm font-medium hover:bg-gray-50 w-full">
        {downloading ? 'Downloading...' : '📥 Export as CSV'}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
