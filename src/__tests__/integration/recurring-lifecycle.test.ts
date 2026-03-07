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
const { createRecurringExpense, processDueExpenses } = await import('@/services/recurring.service')

describe('Recurring Lifecycle (Integration)', () => {
  beforeAll(async () => {
    await resetTestDatabase()
    prisma = getTestPrisma()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await prisma.recurringExpense.deleteMany()
    await prisma.budget.deleteMany()
    await prisma.settlement.deleteMany()
    await prisma.expenseSplit.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.category.deleteMany()
    await prisma.householdInvite.deleteMany()
    await prisma.householdMember.deleteMany()
    await prisma.household.deleteMany()
    await prisma.user.deleteMany()
  })

  it('creates due expense and advances next due date without duplicates', async () => {
    const owner = await prisma.user.create({ data: { email: 'rec-owner@test.com', name: 'Owner' } })
    const member = await prisma.user.create({ data: { email: 'rec-member@test.com', name: 'Member' } })

    const household = await createHousehold({ name: 'Recurring HH', currency: 'USD' }, owner.id)
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: member.id, role: 'member' },
    })

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Utilities' } })
    expect(category).not.toBeNull()

    await createRecurringExpense(household.id, owner.id, {
      amount: 120,
      description: 'Internet',
      categoryId: category!.id,
      splitMethod: 'equal',
      frequency: 'monthly',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
    })

    const firstRun = await processDueExpenses(new Date('2026-03-02T00:00:00.000Z'))
    expect(firstRun.createdCount).toBe(1)

    const secondRun = await processDueExpenses(new Date('2026-03-02T00:00:00.000Z'))
    expect(secondRun.createdCount).toBe(0)

    const expenses = await prisma.expense.findMany({ where: { householdId: household.id } })
    expect(expenses).toHaveLength(1)
  })
})
