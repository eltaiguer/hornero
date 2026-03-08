import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getExpenseById, updateExpense, deleteExpense } from '@/services/expense.service'
import { getCategories } from '@/services/category.service'
import { getHouseholdMembers, getMemberRole, isHouseholdOwner } from '@/services/member.service'
import { formatCurrency, formatRelativeExpenseDate } from '@/lib/formatting'
import { ExpenseForm } from '@/components/expense/expense-form'
import { ReceiptLightboxImage } from '@/components/expense/receipt-lightbox-image'
import type { CreateExpenseInput } from '@/lib/validations/expense'

function requireUserId(value: string | null | undefined): string {
  if (!value) {
    throw new Error('Unauthorized')
  }

  return value
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ expenseId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const { expenseId } = await params
  const expense = await getExpenseById(expenseId)

  if (!expense) {
    notFound()
  }

  const expenseIdValue = expense.id
  const householdId = expense.householdId
  const payerId = expense.payerId

  const role = await getMemberRole(householdId, session.user.id)
  if (!role) {
    redirect('/dashboard')
  }

  const [categories, members] = await Promise.all([
    getCategories(householdId),
    getHouseholdMembers(householdId),
  ])

  const owner = await isHouseholdOwner(householdId, session.user.id)
  const canEdit = owner || payerId === session.user.id

  async function handleUpdate(data: CreateExpenseInput) {
    'use server'
    const s = await auth()
    const userId = requireUserId(s?.user?.id)
    const isOwner = await isHouseholdOwner(householdId, userId)
    if (!isOwner && payerId !== userId) {
      throw new Error('Forbidden')
    }
    await updateExpense(expenseIdValue, data)
    redirect(`/household/expenses/${expenseIdValue}?householdId=${householdId}`)
  }

  async function handleDelete() {
    'use server'
    const s = await auth()
    const userId = requireUserId(s?.user?.id)
    const isOwner = await isHouseholdOwner(householdId, userId)
    if (!isOwner && payerId !== userId) {
      throw new Error('Forbidden')
    }
    await deleteExpense(expenseIdValue)
    redirect(`/household/expenses?householdId=${householdId}`)
  }

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/household/expenses?householdId=${householdId}`} className="text-sm text-blue-600 font-medium hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Expense Detail</h1>
      </div>

      {canEdit ? (
        <ExpenseForm
          expenseId={expense.id}
          receiptUrl={expense.receiptUrl ?? undefined}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            emoji: category.emoji,
            isDefault: category.isDefault,
          }))}
          members={members.map((member) => ({
            id: member.userId,
            name: member.user.name ?? member.user.email ?? 'Unknown',
            salary: member.salary,
          }))}
          initialValues={{
            amount: expense.amount,
            description: expense.description,
            date: expense.date,
            categoryId: expense.categoryId,
            splitMethod: expense.splitMethod as CreateExpenseInput['splitMethod'],
            splitConfig: expense.splitConfig ?? undefined,
            notes: expense.notes ?? undefined,
          }}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
          submitLabel="Update Expense"
        />
      ) : (
        <div className="rounded-md border p-4 space-y-2">
          <p className="text-base font-semibold">{expense.category.emoji ?? '📁'} {expense.description}</p>
          <p className="text-sm text-gray-500">{formatRelativeExpenseDate(expense.date)} · {expense.payer.name ?? 'Unknown'} paid</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(expense.amount)}</p>
          {expense.notes ? <p className="text-sm text-gray-600">{expense.notes}</p> : null}
          {expense.receiptUrl ? (
            <ReceiptLightboxImage src={expense.receiptUrl} alt="Receipt" />
          ) : null}
        </div>
      )}
    </main>
  )
}
