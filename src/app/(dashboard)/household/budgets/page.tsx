import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { checkBudgetAlerts, getBudgetProgress, setBudget } from '@/services/budget.service'
import { getCategories } from '@/services/category.service'
import { BudgetOverview } from '@/components/budget/budget-overview'
import { BudgetForm } from '@/components/budget/budget-form'
import { BudgetAlert } from '@/components/budget/budget-alert'

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string; month?: string; year?: string }>
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

  const month = Number(params.month ?? new Date().getUTCMonth() + 1)
  const year = Number(params.year ?? new Date().getUTCFullYear())

  const [categories, progress, alerts] = await Promise.all([
    getCategories(householdId),
    getBudgetProgress(householdId, month, year),
    checkBudgetAlerts(householdId, month, year),
  ])

  async function handleSetBudget(input: any) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await setBudget(householdId as string, input)
    redirect(`/household/budgets?householdId=${householdId}&month=${input.month}&year=${input.year}`)
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Budgets</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Alerts</h2>
        <BudgetAlert alerts={alerts as any} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Set budget</h2>
        <BudgetForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} onSubmit={handleSetBudget} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Overview</h2>
        <BudgetOverview items={progress} />
      </section>
    </main>
  )
}
