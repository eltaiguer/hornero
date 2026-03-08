import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { formatMonthYear } from '@/lib/formatting'
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
import { TopExpensesList } from '@/components/insights/top-expenses-list'
import { InsightsDashboard } from '@/components/insights/insights-dashboard'

function navigateMonth(month: number, year: number, direction: -1 | 1) {
  const date = new Date(year, month - 1 + direction, 1)
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

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
  const currentDate = new Date(year, month - 1, 1)
  const prev = navigateMonth(month, year, -1)
  const next = navigateMonth(month, year, 1)

  const [summary, byCategory, trend, byMember, topExpenses, budgetVsActual] = await Promise.all([
    getMonthlySummary(householdId, month, year),
    getSpendingByCategory(householdId, month, year),
    getSpendingTrend(householdId, 12),
    getMemberBreakdown(householdId, month, year),
    getTopExpenses(householdId, month, year, 5),
    getBudgetVsActual(householdId, month, year),
  ])

  return (
    <main className="mx-auto max-w-4xl p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Insights</h1>
        <div className="flex items-center gap-2">
          <Link href={`/household/insights?householdId=${householdId}&month=${prev.month}&year=${prev.year}`} className="rounded p-1 hover:bg-gray-100 text-gray-600">◀</Link>
          <p className="text-base font-semibold">{formatMonthYear(currentDate)}</p>
          <Link href={`/household/insights?householdId=${householdId}&month=${next.month}&year=${next.year}`} className="rounded p-1 hover:bg-gray-100 text-gray-600">▶</Link>
        </div>
      </div>

      <MonthlySummaryCard {...summary} />
      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-gray-500">Loading chart...</div>}>
        <InsightsDashboard
          byCategory={byCategory}
          trend={trend}
          byMember={byMember}
          budgetVsActual={budgetVsActual}
        />
      </Suspense>
      <TopExpensesList items={topExpenses.map((item) => ({
        id: item.id,
        description: item.description,
        amount: item.amount,
        emoji: item.category?.emoji ?? '📁',
      }))} />
      <ExportButton householdId={householdId} />
    </main>
  )
}
