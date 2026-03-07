'use client'

import { useState } from 'react'

interface ExpenseFiltersProps {
  categories: Array<{ id: string; name: string }>
  members: Array<{ id: string; name: string }>
  onChange: (filters: { categoryId?: string; payerId?: string }) => void
}

export function ExpenseFilters({ categories, members, onChange }: ExpenseFiltersProps) {
  const [categoryId, setCategoryId] = useState('')
  const [payerId, setPayerId] = useState('')

  function emit(next: { categoryId?: string; payerId?: string }) {
    onChange(next)
  }

  return (
    <div className="grid gap-4 rounded-md border p-4 md:grid-cols-2">
      <div>
        <label htmlFor="filter-category" className="block text-sm font-medium">Category</label>
        <select
          id="filter-category"
          value={categoryId}
          onChange={(e) => {
            const next = e.target.value
            setCategoryId(next)
            emit({ categoryId: next || undefined, payerId: payerId || undefined })
          }}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-payer" className="block text-sm font-medium">Payer</label>
        <select
          id="filter-payer"
          value={payerId}
          onChange={(e) => {
            const next = e.target.value
            setPayerId(next)
            emit({ categoryId: categoryId || undefined, payerId: next || undefined })
          }}
          className="mt-1 w-full rounded-md border px-3 py-2"
        >
          <option value="">All payers</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
