import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import {
  createRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  updateRecurringExpense,
} from '@/services/recurring.service'
import { getCategories } from '@/services/category.service'
import { RecurringExpenseForm } from '@/components/recurring/recurring-expense-form'
import { RecurringExpenseList } from '@/components/recurring/recurring-expense-list'
import { RecurringExpenseActions } from '@/components/recurring/recurring-expense-actions'
import type { CreateRecurringExpenseInput } from '@/lib/validations/recurring'

export default async function RecurringPage({
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

  const [categories, recurring] = await Promise.all([
    getCategories(householdId),
    getRecurringExpenses(householdId),
  ])

  async function handleCreate(input: CreateRecurringExpenseInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createRecurringExpense(householdId as string, s.user.id, input)
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handlePause(id: string) {
    'use server'
    await updateRecurringExpense(id, { active: false })
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handleResume(id: string) {
    'use server'
    await updateRecurringExpense(id, { active: true })
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handleDelete(id: string) {
    'use server'
    await deleteRecurringExpense(id)
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Recurring expenses</h1>

      <RecurringExpenseForm
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
        onSubmit={handleCreate}
      />

      <div className="space-y-3">
        <RecurringExpenseList
          items={recurring.map((item) => ({
            id: item.id,
            description: item.description,
            amount: item.amount,
            frequency: item.frequency,
            nextDueDate: item.nextDueDate,
            active: item.active,
          }))}
        />
        {recurring.map((item) => (
          <RecurringExpenseActions
            key={item.id}
            active={item.active}
            onPause={() => handlePause(item.id)}
            onResume={() => handleResume(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>
    </main>
  )
}
