import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getExpenseById } from '@/services/expense.service'

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

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Expense detail</h1>
      <div className="rounded-md border p-4">
        <p className="font-medium">{expense.description}</p>
        <p className="text-sm text-gray-600">Amount: ${expense.amount.toFixed(2)}</p>
        <p className="text-sm text-gray-600">Category: {expense.category.name}</p>
      </div>
    </main>
  )
}
