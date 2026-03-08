import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { checkBudgetAlerts, deleteBudget, getBudgetProgress, setBudget, getBudgets } from '@/services/budget.service'
import { getCategories } from '@/services/category.service'
import { isHouseholdOwner } from '@/services/member.service'
import { BudgetOverview } from '@/components/budget/budget-overview'
import { BudgetForm } from '@/components/budget/budget-form'
import { BudgetAlert } from '@/components/budget/budget-alert'
import type { CreateBudgetInput } from '@/lib/validations/budget'

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string; month?: string; year?: string; editBudgetId?: string }>
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

  const owner = await isHouseholdOwner(householdId, session.user.id)

  const month = Number(params.month ?? new Date().getUTCMonth() + 1)
  const year = Number(params.year ?? new Date().getUTCFullYear())
  const previous = new Date(year, month - 2, 1)
  const next = new Date(year, month, 1)
  const editBudgetId = params.editBudgetId

  const [categories, progress, alerts, budgets] = await Promise.all([
    getCategories(householdId),
    getBudgetProgress(householdId, month, year),
    checkBudgetAlerts(householdId, month, year),
    getBudgets(householdId, month, year),
  ])

  async function handleSetBudget(input: CreateBudgetInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const canManage = await isHouseholdOwner(householdId as string, s.user.id)
    if (!canManage) throw new Error('Forbidden')
    await setBudget(householdId as string, input)
    redirect(`/household/budgets?householdId=${householdId}&month=${input.month}&year=${input.year}`)
  }

  async function handleDeleteBudget(budgetId: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const canManage = await isHouseholdOwner(householdId as string, s.user.id)
    if (!canManage) throw new Error('Forbidden')
    await deleteBudget(budgetId)
    redirect(`/household/budgets?householdId=${householdId}&month=${month}&year=${year}`)
  }

  const editingBudget = editBudgetId
    ? budgets.find((budget) => budget.id === editBudgetId)
    : undefined

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">Budgets</h1>

      <BudgetAlert alerts={alerts} />

      <BudgetOverview
        items={progress}
        householdId={householdId}
        month={month}
        year={year}
      />

      <section id="budget-form" className="space-y-3">
        <p className="text-sm font-semibold">+ Set Budget for Category</p>
        {owner ? (
          <BudgetForm
            categories={categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
            usedCategoryIds={budgets.map((budget) => budget.categoryId)}
            month={month}
            year={year}
            editingBudget={editingBudget ? {
              id: editingBudget.id,
              categoryId: editingBudget.categoryId,
              amount: editingBudget.amount,
            } : undefined}
            cancelEditHref={`/household/budgets?householdId=${householdId}&month=${month}&year=${year}`}
            onDelete={handleDeleteBudget}
            previousMonthHref={`/household/budgets?householdId=${householdId}&month=${previous.getMonth() + 1}&year=${previous.getFullYear()}`}
            nextMonthHref={`/household/budgets?householdId=${householdId}&month=${next.getMonth() + 1}&year=${next.getFullYear()}`}
            onSubmit={handleSetBudget}
          />
        ) : (
          <p className="text-sm text-red-600">Only household owners can modify budgets.</p>
        )}
      </section>
    </main>
  )
}
