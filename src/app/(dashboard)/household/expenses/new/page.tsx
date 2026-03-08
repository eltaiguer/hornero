import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { getCategories } from '@/services/category.service'
import { getHouseholdMembers } from '@/services/member.service'
import { NewExpenseFormClient } from '@/components/expense/new-expense-form-client'

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

  const [categories, members] = await Promise.all([
    getCategories(householdId),
    getHouseholdMembers(householdId),
  ])

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <Link href={`/household/expenses?householdId=${householdId}`} className="text-sm text-blue-600 font-medium hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold">Add Expense</h1>
      </div>
      <NewExpenseFormClient
        householdId={householdId}
        categories={categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, isDefault: c.isDefault }))}
        members={members.map((member) => ({
          id: member.userId,
          name: member.user.name ?? member.user.email ?? 'Unknown',
          salary: member.salary,
        }))}
      />
    </main>
  )
}
