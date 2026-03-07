import { prisma } from '@/lib/prisma'

export interface MemberBalance {
  userId: string
  balance: number
}

export interface SimplifiedDebt {
  fromUserId: string
  toUserId: string
  amount: number
}

function roundToCents(value: number) {
  return Math.round(value * 100) / 100
}

export async function calculateBalances(householdId: string): Promise<MemberBalance[]> {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  })

  const balances = new Map<string, number>()
  for (const member of members) {
    balances.set(member.userId, 0)
  }

  const expenses = await prisma.expense.findMany({
    where: { householdId },
    select: {
      payerId: true,
      amount: true,
      splits: {
        select: { userId: true, amountOwed: true },
      },
    },
  })

  for (const expense of expenses) {
    balances.set(expense.payerId, (balances.get(expense.payerId) ?? 0) + expense.amount)

    for (const split of expense.splits) {
      balances.set(split.userId, (balances.get(split.userId) ?? 0) - split.amountOwed)
    }
  }

  const settlements = await prisma.settlement.findMany({
    where: { householdId },
    select: { payerId: true, receiverId: true, amount: true },
  })

  for (const settlement of settlements) {
    balances.set(settlement.payerId, (balances.get(settlement.payerId) ?? 0) + settlement.amount)
    balances.set(
      settlement.receiverId,
      (balances.get(settlement.receiverId) ?? 0) - settlement.amount
    )
  }

  return Array.from(balances.entries()).map(([userId, balance]) => ({
    userId,
    balance: roundToCents(balance),
  }))
}

export function getSimplifiedDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  const creditors = balances
    .filter((item) => item.balance > 0)
    .map((item) => ({ ...item }))
    .sort((a, b) => b.balance - a.balance)
  const debtors = balances
    .filter((item) => item.balance < 0)
    .map((item) => ({ userId: item.userId, balance: Math.abs(item.balance) }))
    .sort((a, b) => b.balance - a.balance)

  const result: SimplifiedDebt[] = []
  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const transfer = roundToCents(Math.min(creditor.balance, debtor.balance))

    if (transfer > 0) {
      result.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: transfer,
      })
    }

    creditor.balance = roundToCents(creditor.balance - transfer)
    debtor.balance = roundToCents(debtor.balance - transfer)

    if (creditor.balance <= 0) {
      creditorIndex += 1
    }

    if (debtor.balance <= 0) {
      debtorIndex += 1
    }
  }

  return result
}
