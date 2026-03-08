import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { getHouseholdMembers } from '@/services/member.service'
import { getExpenses } from '@/services/expense.service'
import { checkBudgetAlerts } from '@/services/budget.service'
import { getMonthlySummary } from '@/services/insights.service'
import { MonthlySummaryCard } from '@/components/insights/monthly-summary-card'
import { DashboardBalanceSection } from '@/components/household/dashboard-balance-section'
import { DashboardBudgetAlerts } from '@/components/household/dashboard-budget-alerts'
import { DashboardRecentExpenses } from '@/components/household/dashboard-recent-expenses'
import { HouseholdNavLinks } from '@/components/household/household-nav-links'

export default async function HouseholdHomePage({
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

  const household = households.find((item) => item.id === householdId) ?? households[0]

  const now = new Date()
  const month = now.getUTCMonth() + 1
  const year = now.getUTCFullYear()

  const [balances, members, expenseResult, budgetAlerts, summary] = await Promise.all([
    calculateBalances(householdId),
    getHouseholdMembers(householdId),
    getExpenses(householdId, { pageSize: 5 }),
    checkBudgetAlerts(householdId, month, year),
    getMonthlySummary(householdId, month, year),
  ])

  const allSettled = balances.every((item) => Math.abs(item.balance) < 0.005)

  const debts = getSimplifiedDebts(balances).map((debt) => ({
    ...debt,
    fromName: members.find((m) => m.userId === debt.fromUserId)?.user.name ?? 'Unknown',
    toName: members.find((m) => m.userId === debt.toUserId)?.user.name ?? 'Unknown',
  }))

  const recentExpenses = expenseResult.items.map((expense) => ({
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    category: {
      name: expense.category.name,
      emoji: expense.category.emoji,
    },
    payer: { name: expense.payer.name },
  }))

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{household?.name}</h1>
      </div>

      <MonthlySummaryCard
        totalSpent={summary.totalSpent}
        vsLastMonthPct={summary.vsLastMonthPct}
        vsBudgetPct={summary.vsBudgetPct}
      />

      <DashboardBalanceSection
        debts={debts}
        allSettled={allSettled}
        householdId={householdId}
      />

      <DashboardBudgetAlerts alerts={budgetAlerts} householdId={householdId} />

      <DashboardRecentExpenses expenses={recentExpenses} householdId={householdId} />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500">Quick links</h2>
        <HouseholdNavLinks householdId={householdId} />
      </section>
    </main>
  )
}
