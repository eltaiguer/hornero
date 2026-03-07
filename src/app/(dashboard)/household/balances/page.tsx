import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserHouseholds } from '@/services/household.service'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { createSettlement, getSettlements } from '@/services/settlement.service'
import { getHouseholdMembers } from '@/services/member.service'
import { BalanceCard } from '@/components/balance/balance-card'
import { SimplifiedDebts } from '@/components/balance/simplified-debts'
import { SettleUpForm } from '@/components/balance/settle-up-form'
import { SettlementHistory } from '@/components/balance/settlement-history'

export default async function BalancesPage({
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

  const [balances, settlements, members] = await Promise.all([
    calculateBalances(householdId),
    getSettlements(householdId),
    getHouseholdMembers(householdId),
  ])

  const debtInstructions = getSimplifiedDebts(balances).map((debt) => ({
    ...debt,
    fromName: members.find((m) => m.userId === debt.fromUserId)?.user.name ?? 'Unknown',
    toName: members.find((m) => m.userId === debt.toUserId)?.user.name ?? 'Unknown',
  }))

  async function handleSettle(input: any) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createSettlement(householdId as string, s.user.id, input)
    redirect(`/household/balances?householdId=${householdId}`)
  }

  const currentUserMembers = members.filter((member) => member.userId !== session.user.id)

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Balances</h1>

      <section className="grid gap-3 md:grid-cols-2">
        {balances.map((item) => (
          <BalanceCard
            key={item.userId}
            name={members.find((m) => m.userId === item.userId)?.user.name ?? 'Unknown'}
            balance={item.balance}
          />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Simplified debts</h2>
        <SimplifiedDebts debts={debtInstructions} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Settle up</h2>
        <SettleUpForm
          members={currentUserMembers.map((m) => ({ id: m.userId, name: m.user.name ?? 'Unknown' }))}
          onSubmit={handleSettle}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Settlement history</h2>
        <SettlementHistory items={settlements as any} />
      </section>
    </main>
  )
}
