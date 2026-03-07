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
const {
  getMonthlySummary,
  getSpendingByCategory,
  getSpendingTrend,
  getMemberBreakdown,
  getTopExpenses,
  getBudgetVsActual,
} = await import('@/services/insights.service')
const { setBudget } = await import('@/services/budget.service')
const { exportExpensesCsv } = await import('@/services/export.service')

describe('Insights Lifecycle (Integration)', () => {
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

  it('computes insights and exports CSV from seeded data', async () => {
    const u1 = await prisma.user.create({ data: { email: 'ins-u1@test.com', name: 'Alex' } })
    const u2 = await prisma.user.create({ data: { email: 'ins-u2@test.com', name: 'Sam' } })

    const household = await createHousehold({ name: 'Insights HH', currency: 'USD' }, u1.id)
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: u2.id, role: 'member' },
    })

    const groceries = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Groceries' } })
    const transport = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Transport' } })

    await setBudget(household.id, { categoryId: groceries!.id, month: 3, year: 2026, amount: 500 })

    await createExpense(household.id, {
      amount: 300,
      description: 'Groceries run',
      date: new Date('2026-03-05T00:00:00.000Z'),
      categoryId: groceries!.id,
      splitMethod: 'equal',
    }, u1.id)

    await createExpense(household.id, {
      amount: 100,
      description: 'Bus pass',
      date: new Date('2026-03-07T00:00:00.000Z'),
      categoryId: transport!.id,
      splitMethod: 'equal',
    }, u2.id)

    await createExpense(household.id, {
      amount: 200,
      description: 'February groceries',
      date: new Date('2026-02-10T00:00:00.000Z'),
      categoryId: groceries!.id,
      splitMethod: 'equal',
    }, u1.id)

    const summary = await getMonthlySummary(household.id, 3, 2026)
    expect(summary.totalSpent).toBe(400)

    const byCategory = await getSpendingByCategory(household.id, 3, 2026)
    expect(byCategory).toHaveLength(2)

    const trend = await getSpendingTrend(household.id, 6)
    expect(trend.length).toBeGreaterThan(0)

    const byMember = await getMemberBreakdown(household.id, 3, 2026)
    expect(byMember.length).toBeGreaterThan(0)

    const top = await getTopExpenses(household.id, 3, 2026, 2)
    expect(top[0].amount).toBeGreaterThanOrEqual(top[1].amount)

    const budgetVsActual = await getBudgetVsActual(household.id, 3, 2026)
    expect(budgetVsActual[0].actual).toBe(300)

    const csv = await exportExpensesCsv(
      household.id,
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-31T23:59:59.000Z')
    )
    expect(csv).toContain('date,description,amount,category,payer')
    expect(csv).toContain('Groceries run')
  })
})
