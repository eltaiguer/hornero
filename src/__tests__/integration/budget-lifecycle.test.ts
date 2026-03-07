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
const { setBudget, getBudgetProgress, checkBudgetAlerts } = await import('@/services/budget.service')

describe('Budget Lifecycle (Integration)', () => {
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

  it('tracks budget progress and alerts from expenses', async () => {
    const owner = await prisma.user.create({ data: { email: 'budget-owner@test.com', name: 'Owner' } })
    const household = await createHousehold({ name: 'Budget HH', currency: 'USD' }, owner.id)

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Groceries' } })
    expect(category).not.toBeNull()

    await setBudget(household.id, {
      categoryId: category!.id,
      month: 3,
      year: 2026,
      amount: 500,
    })

    await createExpense(
      household.id,
      {
        amount: 320,
        description: 'Groceries',
        date: new Date('2026-03-11T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'equal',
      },
      owner.id
    )

    const progress = await getBudgetProgress(household.id, 3, 2026)
    expect(progress[0].actualSpent).toBe(320)
    expect(progress[0].percentage).toBe(64)

    await createExpense(
      household.id,
      {
        amount: 120,
        description: 'More groceries',
        date: new Date('2026-03-15T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'equal',
      },
      owner.id
    )

    const alerts = await checkBudgetAlerts(household.id, 3, 2026)
    expect(alerts[0].level).toBe('warning')
  })
})
