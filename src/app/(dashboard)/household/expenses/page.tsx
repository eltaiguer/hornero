import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { getExpenses } from '@/services/expense.service'
import { ExpenseList } from '@/components/expense/expense-list'

export default async function ExpensesPage({
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
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-gray-600">Create a household first to track expenses.</p>
      </main>
    )
  }

  const expenses = await getExpenses(householdId, {})

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link
          href={`/household/expenses/new?householdId=${householdId}`}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add expense
        </Link>
      </div>

      <ExpenseList
        expenses={expenses.items.map((item) => ({
          id: item.id,
          description: item.description,
          amount: item.amount,
          date: item.date,
          category: { name: item.category.name, emoji: item.category.emoji },
          payer: { name: item.payer.name },
        }))}
      />
    </main>
  )
}
