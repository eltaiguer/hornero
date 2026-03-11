import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createHousehold, getUserHouseholds } from '@/services/household.service'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { getHouseholdMembers } from '@/services/member.service'
import { getExpenses } from '@/services/expense.service'
import { checkBudgetAlerts } from '@/services/budget.service'
import { getMonthlySummary } from '@/services/insights.service'
import { getPendingInvitesByEmail, acceptInviteByToken } from '@/services/invite.service'
import { CreateHouseholdForm } from '@/components/household/create-household-form'
import { MonthlySummaryCard } from '@/components/insights/monthly-summary-card'
import { DashboardBalanceSection } from '@/components/household/dashboard-balance-section'
import { DashboardBudgetAlerts } from '@/components/household/dashboard-budget-alerts'
import { DashboardRecentExpenses } from '@/components/household/dashboard-recent-expenses'
import type { CreateHouseholdInput } from '@/lib/validations/household'

export default async function HouseholdHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ householdId?: string; id?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const households = await getUserHouseholds(session.user.id)
  const pendingInvites = session.user.email
    ? await getPendingInvitesByEmail(session.user.email)
    : []

  const params = (await searchParams) ?? {}
  const requestedHouseholdId = params.householdId ?? params.id

  async function handleCreate(data: CreateHouseholdInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    const household = await createHousehold(data, s.user.id)
    redirect(`/household?householdId=${household.id}`)
  }

  async function handleAcceptInvite(token: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id || !s.user.email) throw new Error('Unauthorized')
    await acceptInviteByToken(token, s.user.id, s.user.email)
    redirect('/household')
  }

  if (households.length === 0) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome, {session.user.name ?? session.user.email}</p>

        {pendingInvites.length > 0 && (
          <section className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
            <h2 className="text-lg font-semibold text-blue-900">Pending invites</h2>
            <ul className="mt-3 space-y-2">
              {pendingInvites.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between gap-3 rounded-md bg-white p-3">
                  <p className="text-sm text-gray-700">
                    Join <span className="font-medium">{invite.household.name}</span>
                  </p>
                  <form action={handleAcceptInvite.bind(null, invite.token)}>
                    <button
                      type="submit"
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Accept invite
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-6 space-y-4">
          <p className="text-gray-600">You don&apos;t belong to any household yet. Create one to get started.</p>
          <CreateHouseholdForm onSubmit={handleCreate} />
        </div>
      </main>
    )
  }

  const fallbackHouseholdId = households[0].id
  if (!requestedHouseholdId) {
    redirect(`/household?householdId=${fallbackHouseholdId}`)
  }

  const household = households.find((item) => item.id === requestedHouseholdId) ?? households[0]
  const householdId = household.id

  if (requestedHouseholdId !== householdId) {
    redirect(`/household?householdId=${householdId}`)
  }

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
    </main>
  )
}
