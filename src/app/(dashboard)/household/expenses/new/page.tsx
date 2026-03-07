import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { getCategories } from '@/services/category.service'
import { createExpense } from '@/services/expense.service'
import { ExpenseForm } from '@/components/expense/expense-form'
import type { CreateExpenseInput } from '@/lib/validations/expense'

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)
  const params = (await searchParams) ?? {}
  const householdId = params.householdId ?? households[0]?.id

  if (!householdId) {
    redirect('/dashboard')
  }

  const categories = await getCategories(householdId)

  async function handleSubmit(data: CreateExpenseInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createExpense(householdId as string, data, s.user.id)
    redirect(`/household/expenses?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">New expense</h1>
      <ExpenseForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} onSubmit={handleSubmit} />
    </main>
  )
}
