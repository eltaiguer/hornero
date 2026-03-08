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
const { getExpenses } = await import('@/services/expense.service')

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

  it('materializes due recurring expenses when listing expenses', async () => {
    const owner = await prisma.user.create({ data: { email: 'rec-lazy-owner@test.com', name: 'Owner' } })
    const member = await prisma.user.create({ data: { email: 'rec-lazy-member@test.com', name: 'Member' } })

    const household = await createHousehold({ name: 'Recurring Lazy HH', currency: 'USD' }, owner.id)
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: member.id, role: 'member' },
    })

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Utilities' } })
    expect(category).not.toBeNull()

    await createRecurringExpense(household.id, owner.id, {
      amount: 75,
      description: 'Water',
      categoryId: category!.id,
      splitMethod: 'equal',
      frequency: 'monthly',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
    })

    const before = await prisma.expense.count({ where: { householdId: household.id } })
    expect(before).toBe(0)

    const listed = await getExpenses(household.id, {
      page: 1,
      pageSize: 20,
    })

    expect(listed.items).toHaveLength(1)
    const after = await prisma.expense.count({ where: { householdId: household.id } })
    expect(after).toBe(1)
  })

  it('processes custom split recurring expenses', async () => {
    const owner = await prisma.user.create({ data: { email: 'rec-custom-owner@test.com', name: 'Owner' } })
    const member = await prisma.user.create({ data: { email: 'rec-custom-member@test.com', name: 'Member' } })

    const household = await createHousehold({ name: 'Recurring Custom HH', currency: 'USD' }, owner.id)
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: member.id, role: 'member' },
    })

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Utilities' } })
    expect(category).not.toBeNull()

    await createRecurringExpense(household.id, owner.id, {
      amount: 100,
      description: 'Custom Water',
      categoryId: category!.id,
      splitMethod: 'custom',
      splitConfig: JSON.stringify({ [owner.id]: 70, [member.id]: 30 }),
      frequency: 'monthly',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
    })

    const result = await processDueExpenses(new Date('2026-03-02T00:00:00.000Z'))
    expect(result.createdCount).toBe(1)

    const expense = await prisma.expense.findFirst({ where: { householdId: household.id } })
    const splits = await prisma.expenseSplit.findMany({ where: { expenseId: expense!.id } })
    const byUser = new Map(splits.map((split) => [split.userId, split.amountOwed]))

    expect(byUser.get(owner.id)).toBe(70)
    expect(byUser.get(member.id)).toBe(30)
  })
})
