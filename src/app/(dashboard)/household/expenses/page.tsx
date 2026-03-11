import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { getExpenses } from '@/services/expense.service'
import { getCategories } from '@/services/category.service'
import { getHouseholdMembers } from '@/services/member.service'
import { ExpenseList } from '@/components/expense/expense-list'
import { ExpenseFiltersPanel } from '@/components/expense/expense-filters-panel'
import { PullToRefresh } from '@/components/expense/pull-to-refresh'

function parseNumber(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseDate(value?: string) {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function buildNextPageHref(
  householdId: string,
  cursor: string,
  params: Record<string, string | undefined>
) {
  const search = new URLSearchParams()
  search.set('householdId', householdId)
  search.set('cursor', cursor)
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== 'cursor' && key !== 'householdId') {
      search.set(key, value)
    }
  }
  return `/household/expenses?${search.toString()}`
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    householdId?: string
    categoryId?: string
    payerId?: string
    page?: string
    pageSize?: string
    cursor?: string
    dateFrom?: string
    dateTo?: string
    minAmount?: string
    maxAmount?: string
  }>
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
      <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6">
        <p className="text-gray-600">Create a household first to track expenses.</p>
      </main>
    )
  }

  const [categories, members, expenses] = await Promise.all([
    getCategories(householdId),
    getHouseholdMembers(householdId),
    getExpenses(householdId, {
      categoryId: params.categoryId,
      payerId: params.payerId,
      page: parseNumber(params.page),
      pageSize: parseNumber(params.pageSize),
      cursor: params.cursor,
      dateFrom: parseDate(params.dateFrom),
      dateTo: parseDate(params.dateTo),
      minAmount: parseNumber(params.minAmount),
      maxAmount: parseNumber(params.maxAmount),
    }),
  ])

  const nextPageHref = expenses.nextCursor
    ? buildNextPageHref(householdId, expenses.nextCursor, params)
    : undefined

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link
          href={`/household/expenses/new?householdId=${householdId}`}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Add expense
        </Link>
      </div>

      <Suspense fallback={<div className="rounded-md border p-4 text-sm text-gray-500">Loading filters...</div>}>
        <ExpenseFiltersPanel
          householdId={householdId}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name,
            emoji: category.emoji,
          }))}
          members={members.map((member) => ({ id: member.userId, name: member.user.name ?? member.user.email ?? 'Unknown' }))}
          initialValue={{
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            categoryId: params.categoryId,
            payerId: params.payerId,
            minAmount: params.minAmount,
            maxAmount: params.maxAmount,
          }}
        />
      </Suspense>

      <PullToRefresh>
        <ExpenseList
          householdId={householdId}
          totalCount={expenses.total}
          nextPageHref={nextPageHref}
          expenses={expenses.items.map((item) => ({
            id: item.id,
            description: item.description,
            amount: item.amount,
            date: item.date,
            category: { name: item.category.name, emoji: item.category.emoji },
            payer: { name: item.payer.name },
          }))}
        />
      </PullToRefresh>
    </main>
  )
}
