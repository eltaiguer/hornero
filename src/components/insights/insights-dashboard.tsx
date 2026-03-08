'use client'

import dynamic from 'next/dynamic'

const CategoryDonutChart = dynamic(
  () => import('./category-donut-chart').then((mod) => mod.CategoryDonutChart),
  { ssr: false, loading: () => <div className="rounded-md border p-4 text-sm text-gray-500">Loading chart...</div> }
)
const SpendingTrendChart = dynamic(
  () => import('./spending-trend-chart').then((mod) => mod.SpendingTrendChart),
  { ssr: false, loading: () => <div className="rounded-md border p-4 text-sm text-gray-500">Loading chart...</div> }
)
const MemberBreakdownChart = dynamic(
  () => import('./member-breakdown-chart').then((mod) => mod.MemberBreakdownChart),
  { ssr: false, loading: () => <div className="rounded-md border p-4 text-sm text-gray-500">Loading chart...</div> }
)
const BudgetVsActualChart = dynamic(
  () => import('./budget-vs-actual-chart').then((mod) => mod.BudgetVsActualChart),
  { ssr: false, loading: () => <div className="rounded-md border p-4 text-sm text-gray-500">Loading chart...</div> }
)

interface Props {
  byCategory: Array<{ category: string; amount: number; percentage: number; color?: string; emoji?: string }>
  trend: Array<{ month: string; total: number }>
  byMember: Array<{ userId: string; name: string; amount: number }>
  budgetVsActual: Array<{ category: string; budget: number; actual: number; color?: string; emoji?: string }>
}

export function InsightsDashboard({ byCategory, trend, byMember, budgetVsActual }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CategoryDonutChart data={byCategory} />
        <SpendingTrendChart data={trend} />
      </div>
      <MemberBreakdownChart data={byMember} />
      <BudgetVsActualChart data={budgetVsActual} />
    </div>
  )
}
