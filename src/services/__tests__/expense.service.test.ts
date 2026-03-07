import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createExpense,
  deleteExpense,
  getExpenseById,
  getExpenses,
  updateExpense,
} from '../expense.service'
import { prisma } from '@/lib/prisma'
import * as splitService from '../split.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findFirst: vi.fn(),
    },
    householdMember: {
      findMany: vi.fn(),
    },
    expense: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    expenseSplit: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  },
}))

describe('ExpenseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates expense and splits in a transaction', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ] as any)
    vi.spyOn(splitService, 'calculateSplits').mockReturnValue([
      { userId: 'u1', amountOwed: 50 },
      { userId: 'u2', amountOwed: 50 },
    ])
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: 'exp-1', amount: 100 } as any)
    vi.mocked(prisma.expenseSplit.createMany).mockResolvedValue({ count: 2 } as any)

    const result = await createExpense(
      'hh-1',
      {
        amount: 100,
        description: 'Groceries',
        date: new Date('2026-03-01T00:00:00.000Z'),
        categoryId: 'cat-1',
        splitMethod: 'equal',
      },
      'u1'
    )

    expect(result.id).toBe('exp-1')
    expect(prisma.$transaction).toHaveBeenCalledOnce()
  })

  it('lists expenses with pagination', async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([{ id: 'exp-1' }] as any)
    vi.mocked(prisma.expense.count).mockResolvedValue(1)

    const result = await getExpenses('hh-1', { page: 1, pageSize: 20 })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('gets expense detail', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({ id: 'exp-1' } as any)

    const result = await getExpenseById('exp-1')

    expect(result?.id).toBe('exp-1')
  })

  it('updates expense and recomputes splits', async () => {
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({
      id: 'exp-1',
      householdId: 'hh-1',
      amount: 100,
      description: 'Old',
      date: new Date('2026-03-01T00:00:00.000Z'),
      categoryId: 'cat-1',
      splitMethod: 'equal',
      splitConfig: null,
      payerId: 'u1',
    } as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ] as any)
    vi.spyOn(splitService, 'calculateSplits').mockReturnValue([
      { userId: 'u1', amountOwed: 60 },
      { userId: 'u2', amountOwed: 60 },
    ])
    vi.mocked(prisma.expense.update).mockResolvedValue({ id: 'exp-1', amount: 120 } as any)
    vi.mocked(prisma.expenseSplit.deleteMany).mockResolvedValue({ count: 2 } as any)
    vi.mocked(prisma.expenseSplit.createMany).mockResolvedValue({ count: 2 } as any)

    const result = await updateExpense('exp-1', { amount: 120 })

    expect(result.amount).toBe(120)
    expect(prisma.expenseSplit.deleteMany).toHaveBeenCalledWith({ where: { expenseId: 'exp-1' } })
  })

  it('deletes expense', async () => {
    vi.mocked(prisma.expense.delete).mockResolvedValue({ id: 'exp-1' } as any)

    await deleteExpense('exp-1')

    expect(prisma.expense.delete).toHaveBeenCalledWith({ where: { id: 'exp-1' } })
  })
})
