import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import {
  getBudgetVsActual,
  getMemberBreakdown,
  getMonthlySummary,
  getSpendingByCategory,
  getSpendingTrend,
  getTopExpenses,
} from '@/services/insights.service'
import { ExportButton } from '@/components/insights/export-button'
import { MonthlySummaryCard } from '@/components/insights/monthly-summary-card'
import { CategoryDonutChart } from '@/components/insights/category-donut-chart'
import { SpendingTrendChart } from '@/components/insights/spending-trend-chart'
import { MemberBreakdownChart } from '@/components/insights/member-breakdown-chart'
import { TopExpensesList } from '@/components/insights/top-expenses-list'
import { BudgetVsActualChart } from '@/components/insights/budget-vs-actual-chart'

export default async function InsightsPage({
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

  const [summary, byCategory, trend, byMember, topExpenses, budgetVsActual] = await Promise.all([
    getMonthlySummary(householdId, month, year),
    getSpendingByCategory(householdId, month, year),
    getSpendingTrend(householdId, 6),
    getMemberBreakdown(householdId, month, year),
    getTopExpenses(householdId, month, year, 5),
    getBudgetVsActual(householdId, month, year),
  ])

  async function handleExport(input: { from: string; to: string }) {
    'use server'
    void input
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Insights</h1>

      <MonthlySummaryCard {...summary} />
      <CategoryDonutChart data={byCategory} />
      <SpendingTrendChart data={trend} />
      <MemberBreakdownChart data={byMember.map((item) => ({ ...item, name: item.userId }))} />
      <TopExpensesList items={topExpenses.map((item) => ({ id: item.id, description: item.description, amount: item.amount }))} />
      <BudgetVsActualChart data={budgetVsActual} />
      <ExportButton onExport={handleExport} />
    </main>
  )
}
