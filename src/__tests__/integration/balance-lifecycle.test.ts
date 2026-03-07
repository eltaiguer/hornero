import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { disconnectTestDatabase, getTestPrisma, resetTestDatabase } from '../helpers/prisma'

let prisma: PrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return prisma
  },
}))

const { createHousehold } = await import('@/services/household.service')
const { createExpense } = await import('@/services/expense.service')
const { calculateBalances } = await import('@/services/balance.service')
const { createSettlement } = await import('@/services/settlement.service')

describe('Balance Lifecycle (Integration)', () => {
  beforeAll(async () => {
    await resetTestDatabase()
    prisma = getTestPrisma()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await prisma.recurringExpense.deleteMany()
    await prisma.settlement.deleteMany()
    await prisma.expenseSplit.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.category.deleteMany()
    await prisma.householdInvite.deleteMany()
    await prisma.householdMember.deleteMany()
    await prisma.household.deleteMany()
    await prisma.user.deleteMany()
  })

  it('updates balances after settle up', async () => {
    const u1 = await prisma.user.create({ data: { email: 'b1@test.com', name: 'One' } })
    const u2 = await prisma.user.create({ data: { email: 'b2@test.com', name: 'Two' } })

    const household = await createHousehold({ name: 'Balance HH', currency: 'USD' }, u1.id)
    await prisma.householdMember.create({ data: { householdId: household.id, userId: u2.id, role: 'member' } })

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Groceries' } })
    expect(category).not.toBeNull()

    await createExpense(
      household.id,
      {
        amount: 100,
        description: 'Groceries',
        date: new Date('2026-03-05T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'equal',
      },
      u1.id
    )

    const before = await calculateBalances(household.id)
    expect(before.find((b: any) => b.userId === u1.id)?.balance).toBe(50)
    expect(before.find((b: any) => b.userId === u2.id)?.balance).toBe(-50)

    await createSettlement(household.id, u2.id, {
      receiverId: u1.id,
      amount: 30,
      note: 'partial',
    })

    const after = await calculateBalances(household.id)
    expect(after.find((b: any) => b.userId === u1.id)?.balance).toBe(20)
    expect(after.find((b: any) => b.userId === u2.id)?.balance).toBe(-20)
  })
})
