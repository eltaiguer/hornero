import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateBalances, getSimplifiedDebts } from '../balance.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    householdMember: { findMany: vi.fn() },
    expense: { findMany: vi.fn() },
    settlement: { findMany: vi.fn() },
  },
}))

describe('BalanceService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('computes balances for two members where one paid all expenses', async () => {
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as any)

    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      {
        payerId: 'u1',
        amount: 100,
        splits: [
          { userId: 'u1', amountOwed: 50 },
          { userId: 'u2', amountOwed: 50 },
        ],
      },
    ] as any)

    vi.mocked(prisma.settlement.findMany).mockResolvedValue([] as any)

    const balances = await calculateBalances('hh-1')

    expect(balances).toEqual([
      { userId: 'u1', balance: 50 },
      { userId: 'u2', balance: -50 },
    ])
  })

  it('applies settlements to balances', async () => {
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as any)

    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      {
        payerId: 'u1',
        amount: 100,
        splits: [
          { userId: 'u1', amountOwed: 50 },
          { userId: 'u2', amountOwed: 50 },
        ],
      },
    ] as any)

    vi.mocked(prisma.settlement.findMany).mockResolvedValue([
      { payerId: 'u2', receiverId: 'u1', amount: 20 },
    ] as any)

    const balances = await calculateBalances('hh-1')

    expect(balances).toEqual([
      { userId: 'u1', balance: 30 },
      { userId: 'u2', balance: -30 },
    ])
  })

  it('builds simplified debts for three members', async () => {
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
      { userId: 'u3' },
    ] as any)
    vi.mocked(prisma.expense.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.settlement.findMany).mockResolvedValue([] as any)

    const debts = getSimplifiedDebts([
      { userId: 'u1', balance: 70 },
      { userId: 'u2', balance: -50 },
      { userId: 'u3', balance: -20 },
    ])

    expect(debts).toEqual([
      { fromUserId: 'u2', toUserId: 'u1', amount: 50 },
      { fromUserId: 'u3', toUserId: 'u1', amount: 20 },
    ])
  })
})
