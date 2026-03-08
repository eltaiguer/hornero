'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { CreateExpenseInput } from '@/lib/validations/expense'
import { ExpenseForm } from './expense-form'

interface CategoryOption {
  id: string
  name: string
  emoji?: string | null
  isDefault?: boolean
}

interface MemberOption {
  id: string
  name: string
  salary?: number | null
}

interface NewExpenseFormClientProps {
  householdId: string
  categories: CategoryOption[]
  members: MemberOption[]
}

function appendString(formData: FormData, key: string, value: string | undefined) {
  if (!value) return
  formData.set(key, value)
}

function getApiErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') return 'Something went wrong. Please try again.'
  if ('error' in payload && typeof payload.error === 'string' && payload.error.trim()) {
    return payload.error
  }
  return 'Something went wrong. Please try again.'
}

export function NewExpenseFormClient({
  householdId,
  categories,
  members,
}: NewExpenseFormClientProps) {
  const router = useRouter()
  const [error, setError] = useState('')

  async function createExpense(data: CreateExpenseInput, file: File | null) {
    setError('')
    const endpoint = `/api/households/${householdId}/expenses`

    const response = file
      ? await (async () => {
        const formData = new FormData()
        formData.set('amount', String(data.amount))
        formData.set('description', data.description)
        formData.set('date', data.date.toISOString())
        formData.set('categoryId', data.categoryId)
        formData.set('splitMethod', data.splitMethod)
        appendString(formData, 'splitConfig', data.splitConfig)
        appendString(formData, 'notes', data.notes)
        formData.set('file', file)

        return fetch(endpoint, {
          method: 'POST',
          body: formData,
        })
      })()
      : await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: data.date.toISOString(),
        }),
      })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      setError(getApiErrorMessage(payload))
      return
    }

    router.push(`/household/expenses?householdId=${householdId}`)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      ) : null}
      <ExpenseForm
        submitLabel="Save Expense"
        categories={categories}
        members={members}
        onSubmit={async (data) => createExpense(data, null)}
        onSubmitWithReceipt={createExpense}
      />
    </div>
  )
}
