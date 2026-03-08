import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { createSettlement, getSettlements } from '@/services/settlement.service'
import { getHouseholdMembers } from '@/services/member.service'
import { getUserHouseholds } from '@/services/household.service'
import { BalanceCard } from '@/components/balance/balance-card'
import { SimplifiedDebts } from '@/components/balance/simplified-debts'
import { SettlementHistory } from '@/components/balance/settlement-history'
import type { CreateSettlementInput } from '@/lib/validations/settlement'

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

  const maxAbsBalance = Math.max(...balances.map((item) => Math.abs(item.balance)), 1)

  const debtInstructions = getSimplifiedDebts(balances).map((debt) => ({
    ...debt,
    fromName: members.find((m) => m.userId === debt.fromUserId)?.user.name ?? 'Unknown',
    toName: members.find((m) => m.userId === debt.toUserId)?.user.name ?? 'Unknown',
  }))

  async function handleSettle(input: CreateSettlementInput) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createSettlement(householdId as string, s.user.id, input)
    redirect(`/household/balances?householdId=${householdId}`)
  }

  const allSettled = balances.every((item) => Math.abs(item.balance) < 0.005)

  return (
    <main className="mx-auto max-w-2xl p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-bold">Balances</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Household Balance</h2>
        {allSettled ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-center text-green-700 font-medium">
            ✓ All settled up!
          </div>
        ) : (
          <div className="grid gap-3">
            {balances.map((item) => (
              <BalanceCard
                key={item.userId}
                name={members.find((m) => m.userId === item.userId)?.user.name ?? 'Unknown'}
                balance={item.balance}
                maxAbsBalance={maxAbsBalance}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Who owes whom</h2>
        <SimplifiedDebts
          debts={debtInstructions}
          currentUserId={session.user.id}
          onSettle={handleSettle}
        />
      </section>

      <section className="border-t pt-6 mt-6 space-y-3">
        <h2 className="text-lg font-semibold">Settlement History</h2>
        <SettlementHistory
          items={settlements.map((settlement) => ({
            id: settlement.id,
            payer: { name: settlement.payer.name },
            receiver: { name: settlement.receiver.name },
            amount: settlement.amount,
            date: settlement.date,
            note: settlement.note,
          }))}
        />
      </section>
    </main>
  )
}
