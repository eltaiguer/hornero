import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  disconnectTestDatabase,
  getTestPrisma,
  resetTestDatabase,
} from '../helpers/prisma'

let prisma: PrismaClient

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return prisma
  },
}))

const { createHousehold } = await import('@/services/household.service')
const { updateMemberSalary } = await import('@/services/member.service')
const {
  createExpense,
  deleteExpense,
  getExpenseById,
  updateExpense,
} = await import('@/services/expense.service')

describe('Expense Lifecycle (Integration)', () => {
  beforeAll(async () => {
    await resetTestDatabase()
    prisma = getTestPrisma()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await prisma.expenseSplit.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.category.deleteMany()
    await prisma.householdInvite.deleteMany()
    await prisma.householdMember.deleteMany()
    await prisma.household.deleteMany()
    await prisma.user.deleteMany()
  })

  it('handles create, split calculation, update, and delete', async () => {
    const owner = await prisma.user.create({ data: { email: 'owner-exp@test.com', name: 'Owner' } })
    const member = await prisma.user.create({ data: { email: 'member-exp@test.com', name: 'Member' } })

    const household = await createHousehold({ name: 'Expense HH', currency: 'USD' }, owner.id)
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: member.id, role: 'member' },
    })

    await updateMemberSalary(household.id, owner.id, 4000)
    await updateMemberSalary(household.id, member.id, 2000)

    const category = await prisma.category.findFirst({ where: { householdId: household.id, name: 'Groceries' } })
    expect(category).not.toBeNull()

    const equalExpense = await createExpense(
      household.id,
      {
        amount: 120,
        description: 'Equal split',
        date: new Date('2026-03-02T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'equal',
      },
      owner.id
    )

    const proportionalExpense = await createExpense(
      household.id,
      {
        amount: 120,
        description: 'Proportional split',
        date: new Date('2026-03-03T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'proportional',
      },
      owner.id
    )

    const customExpense = await createExpense(
      household.id,
      {
        amount: 100,
        description: 'Custom split',
        date: new Date('2026-03-04T00:00:00.000Z'),
        categoryId: category!.id,
        splitMethod: 'custom',
        splitConfig: JSON.stringify({ [owner.id]: 70, [member.id]: 30 }),
      },
      owner.id
    )

    expect(equalExpense.id).toBeDefined()
    expect(proportionalExpense.id).toBeDefined()
    expect(customExpense.id).toBeDefined()

    const detail = await getExpenseById(customExpense.id)
    expect(detail?.splits).toHaveLength(2)

    const updated = await updateExpense(customExpense.id, {
      amount: 150,
      splitMethod: 'equal',
    })

    expect(updated.amount).toBe(150)

    await deleteExpense(proportionalExpense.id)
    const deleted = await getExpenseById(proportionalExpense.id)
    expect(deleted).toBeNull()
  })
})
