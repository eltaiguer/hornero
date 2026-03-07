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
const { uploadReceipt } = await import('@/services/receipt.service')

describe('Receipt Upload Lifecycle (Integration)', () => {
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

  it('stores receipt url on expense', async () => {
    const owner = await prisma.user.create({ data: { email: 'receipt@test.com', name: 'Owner' } })
    const household = await createHousehold({ name: 'Receipt HH', currency: 'USD' }, owner.id)
    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Groceries' } })

    const expense = await createExpense(
      household.id,
      {
        amount: 100,
        description: 'Groceries',
        date: new Date('2026-03-01T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'equal',
      },
      owner.id
    )

    const updated = await uploadReceipt(
      expense.id,
      Object.assign(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }), {
        name: 'receipt.png',
      })
    )

    expect(updated.receiptUrl).toContain('/uploads/')
  })
})
