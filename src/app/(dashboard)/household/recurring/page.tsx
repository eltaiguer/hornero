import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatShortDateLabel } from '@/lib/formatting'
import { getUserHouseholds } from '@/services/household.service'
import { getHouseholdMembers, getMemberRole } from '@/services/member.service'
import {
  createRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
  updateRecurringExpense,
} from '@/services/recurring.service'
import { getCategories } from '@/services/category.service'
import { RecurringExpenseForm } from '@/components/recurring/recurring-expense-form'
import type { CreateRecurringExpenseInput } from '@/lib/validations/recurring'

function formatFrequency(frequency: string) {
  if (frequency === 'daily') return 'Daily'
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'monthly') return 'Monthly'
  return 'Yearly'
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string; edit?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)
  const params = (await searchParams) ?? {}
  const householdId = params.householdId ?? households[0]?.id
  const editId = params.edit

  if (!householdId) {
    redirect('/dashboard')
  }

  const [categories, recurring, members] = await Promise.all([
    getCategories(householdId),
    getRecurringExpenses(householdId),
    getHouseholdMembers(householdId),
  ])

  const editingRecurring = editId ? recurring.find((item) => item.id === editId) : undefined

  async function assertRecurringAccess(userId: string, recurringId: string) {
    const role = await getMemberRole(householdId as string, userId)
    if (!role) {
      throw new Error('Forbidden')
    }

    const item = await prisma.recurringExpense.findFirst({
      where: { id: recurringId, householdId: householdId as string },
      select: { id: true },
    })
    if (!item) {
      throw new Error('Recurring expense not found')
    }
  }

  async function handleCreate(input: CreateRecurringExpenseInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const role = await getMemberRole(householdId as string, s.user.id)
    if (!role) throw new Error('Forbidden')
    await createRecurringExpense(householdId as string, s.user.id, input)
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handleUpdate(recurringId: string, input: CreateRecurringExpenseInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await assertRecurringAccess(s.user.id, recurringId)
    await updateRecurringExpense(recurringId, input)
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handlePause(id: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await assertRecurringAccess(s.user.id, id)
    await updateRecurringExpense(id, { active: false })
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handleResume(id: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await assertRecurringAccess(s.user.id, id)
    await updateRecurringExpense(id, { active: true })
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  async function handleDelete(id: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await assertRecurringAccess(s.user.id, id)
    await deleteRecurringExpense(id)
    redirect(`/household/recurring?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring Expenses</h1>
      </div>

      <section id="recurring-form">
        {editingRecurring ? (
          <RecurringExpenseForm
            categories={categories.map((category) => ({ id: category.id, name: category.name, emoji: category.emoji }))}
            members={members.map((member) => ({
              id: member.userId,
              name: member.user.name ?? member.user.email ?? 'Unknown',
              salary: member.salary,
            }))}
            initialValues={{
              amount: editingRecurring.amount,
              description: editingRecurring.description,
              categoryId: editingRecurring.categoryId,
              splitMethod: editingRecurring.splitMethod as CreateRecurringExpenseInput['splitMethod'],
              splitConfig: editingRecurring.splitConfig ?? undefined,
              frequency: editingRecurring.frequency as CreateRecurringExpenseInput['frequency'],
              startDate: editingRecurring.nextDueDate,
              endDate: editingRecurring.endDate ?? undefined,
            }}
            submitLabel="Update Recurring Expense"
            cancelHref={`/household/recurring?householdId=${householdId}`}
            onSubmit={handleUpdate.bind(null, editingRecurring.id)}
          />
        ) : (
          <RecurringExpenseForm
            categories={categories.map((category) => ({ id: category.id, name: category.name, emoji: category.emoji }))}
            members={members.map((member) => ({
              id: member.userId,
              name: member.user.name ?? member.user.email ?? 'Unknown',
              salary: member.salary,
            }))}
            onSubmit={handleCreate}
          />
        )}
      </section>

      {recurring.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No recurring expenses</p>
          <a
            href="#recurring-form"
            className="mt-3 inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Add a recurring expense
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {recurring.map((item) => (
            <li key={item.id} className={`rounded-md border p-4 space-y-2 ${item.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.category.emoji ?? '📁'} {item.description}</p>
                <span className={item.active
                  ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium'
                  : 'rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-medium'}>
                  {item.active ? '● Active' : '⏸ Paused'}
                </span>
              </div>
              <p className="text-xs text-gray-500">{formatCurrency(item.amount)} · {formatFrequency(item.frequency)}</p>
              <p className="text-xs text-gray-500">Next: {item.active ? formatShortDateLabel(item.nextDueDate) : '—'}</p>

              <div className="flex justify-end gap-1">
                {item.active ? (
                  <form action={handlePause.bind(null, item.id)}>
                    <button type="submit" className="rounded p-1.5 hover:bg-gray-100 text-gray-500" aria-label="Pause recurring expense">⏸</button>
                  </form>
                ) : (
                  <form action={handleResume.bind(null, item.id)}>
                    <button type="submit" className="rounded p-1.5 hover:bg-gray-100 text-gray-500" aria-label="Resume recurring expense">▶</button>
                  </form>
                )}
                <Link
                  href={`/household/recurring?householdId=${householdId}&edit=${item.id}`}
                  className="rounded p-1.5 hover:bg-blue-50 text-blue-600"
                  aria-label="Edit recurring expense"
                >
                  ✏️
                </Link>
                <form action={handleDelete.bind(null, item.id)}>
                  <button type="submit" className="rounded p-1.5 hover:bg-red-50 text-red-600" aria-label="Delete recurring expense">🗑</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
