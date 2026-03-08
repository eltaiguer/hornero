import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  advanceNextDueDate,
  createRecurringExpense,
  deleteRecurringExpense,
  ensureDueExpensesForHousehold,
  getRecurringExpenses,
  pauseRecurringExpense,
  processDueExpenses,
  resumeRecurringExpense,
  updateRecurringExpense,
} from '../recurring.service'
import { prisma } from '@/lib/prisma'
import * as splitService from '../split.service'
import * as memberService from '../member.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    recurringExpense: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    expense: { create: vi.fn(), findMany: vi.fn() },
    expenseSplit: { createMany: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  },
}))
vi.mock('../member.service', () => ({
  getMembersWithEffectiveSalary: vi.fn(),
}))
vi.mock('../push.service', () => ({
  notifyBudgetThresholds: vi.fn(),
}))

describe('RecurringService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('creates recurring expense with next due date from start date', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
    vi.mocked(prisma.recurringExpense.create).mockResolvedValue({ id: 'r-1' } as any)

    const result = await createRecurringExpense('hh-1', 'u1', {
      amount: 100,
      description: 'Rent',
      categoryId: 'cat-1',
      splitMethod: 'equal',
      frequency: 'monthly',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
    })

    expect(result.id).toBe('r-1')
  })

  it('updates recurring expense', async () => {
    vi.mocked(prisma.recurringExpense.findUnique).mockResolvedValue({
      id: 'r-1',
      splitMethod: 'equal',
      splitConfig: null,
    } as any)
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: 'r-1', active: false } as any)

    const result = await updateRecurringExpense('r-1', { active: false })

    expect(result.active).toBe(false)
  })

  it('pauses and resumes recurring expense', async () => {
    vi.mocked(prisma.recurringExpense.findUnique).mockResolvedValue({
      id: 'r-1',
      splitMethod: 'equal',
      splitConfig: null,
    } as any)
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: 'r-1', active: false } as any)

    await pauseRecurringExpense('r-1')
    await resumeRecurringExpense('r-1')

    expect(prisma.recurringExpense.update).toHaveBeenCalledTimes(2)
  })

  it('lists recurring expenses', async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([{ id: 'r-1' }] as any)

    const result = await getRecurringExpenses('hh-1')

    expect(result).toHaveLength(1)
  })

  it('processes due recurring expenses once and advances next due date', async () => {
    const dueDate = new Date('2026-03-01T00:00:00.000Z')

    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([
      {
        id: 'r-1',
        householdId: 'hh-1',
        payerId: 'u1',
        amount: 100,
        description: 'Rent',
        categoryId: 'cat-1',
        splitMethod: 'equal',
        splitConfig: null,
        frequency: 'monthly',
        nextDueDate: dueDate,
        endDate: null,
        active: true,
      },
    ] as any)

    vi.mocked(prisma.expense.findMany).mockResolvedValue([] as any)
    vi.mocked(memberService.getMembersWithEffectiveSalary).mockResolvedValue([
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ] as any)
    vi.spyOn(splitService, 'calculateSplits').mockReturnValue([
      { userId: 'u1', amountOwed: 50 },
      { userId: 'u2', amountOwed: 50 },
    ])
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: 'exp-1' } as any)
    vi.mocked(prisma.expenseSplit.createMany).mockResolvedValue({ count: 2 } as any)
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: 'r-1' } as any)

    const result = await processDueExpenses(new Date('2026-03-01T12:00:00.000Z'))

    expect(result.createdCount).toBe(1)
    expect(result.skippedCount).toBe(0)
    expect(prisma.expense.create).toHaveBeenCalledTimes(1)
    expect(prisma.recurringExpense.update).toHaveBeenCalledWith({
      where: { id: 'r-1' },
      data: expect.objectContaining({ nextDueDate: new Date('2026-04-01T00:00:00.000Z') }),
    })
  })

  it('deletes recurring expense', async () => {
    vi.mocked(prisma.recurringExpense.delete).mockResolvedValue({ id: 'r-1' } as any)

    await deleteRecurringExpense('r-1')

    expect(prisma.recurringExpense.delete).toHaveBeenCalledWith({ where: { id: 'r-1' } })
  })

  it('processes due recurring expenses for a single household', async () => {
    const dueDate = new Date('2026-03-01T00:00:00.000Z')

    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([
      {
        id: 'r-1',
        householdId: 'hh-1',
        payerId: 'u1',
        amount: 100,
        description: 'Rent',
        categoryId: 'cat-1',
        splitMethod: 'equal',
        splitConfig: null,
        frequency: 'monthly',
        nextDueDate: dueDate,
        endDate: null,
        active: true,
      },
    ] as any)
    vi.mocked(memberService.getMembersWithEffectiveSalary).mockResolvedValue([
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ] as any)
    vi.spyOn(splitService, 'calculateSplits').mockReturnValue([
      { userId: 'u1', amountOwed: 50 },
      { userId: 'u2', amountOwed: 50 },
    ])
    vi.mocked(prisma.expense.create).mockResolvedValue({ id: 'exp-1' } as any)
    vi.mocked(prisma.expenseSplit.createMany).mockResolvedValue({ count: 2 } as any)
    vi.mocked(prisma.recurringExpense.update).mockResolvedValue({ id: 'r-1' } as any)

    const result = await ensureDueExpensesForHousehold('hh-1', new Date('2026-03-10T00:00:00.000Z'))

    expect(result.createdCount).toBe(1)
    expect(result.skippedCount).toBe(0)
    expect(prisma.recurringExpense.findMany).toHaveBeenCalledWith({
      where: {
        householdId: 'hh-1',
        active: true,
        nextDueDate: { lte: new Date('2026-03-10T00:00:00.000Z') },
      },
    })
  })

  it('advances due date by frequency', () => {
    expect(advanceNextDueDate(new Date('2026-03-01T00:00:00.000Z'), 'daily')).toEqual(
      new Date('2026-03-02T00:00:00.000Z')
    )
    expect(advanceNextDueDate(new Date('2026-03-01T00:00:00.000Z'), 'weekly')).toEqual(
      new Date('2026-03-08T00:00:00.000Z')
    )
    expect(advanceNextDueDate(new Date('2026-03-01T00:00:00.000Z'), 'monthly')).toEqual(
      new Date('2026-04-01T00:00:00.000Z')
    )
    expect(advanceNextDueDate(new Date('2026-03-01T00:00:00.000Z'), 'yearly')).toEqual(
      new Date('2027-03-01T00:00:00.000Z')
    )
  })

  it('skips invalid recurring entries without crashing batch', async () => {
    vi.mocked(prisma.recurringExpense.findMany).mockResolvedValue([
      {
        id: 'r-bad',
        householdId: 'hh-1',
        payerId: 'u1',
        amount: 100,
        description: 'Broken custom',
        categoryId: 'cat-1',
        splitMethod: 'custom',
        splitConfig: null,
        frequency: 'monthly',
        nextDueDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: null,
        active: true,
      },
    ] as any)
    vi.mocked(memberService.getMembersWithEffectiveSalary).mockResolvedValue([
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ] as any)

    const result = await processDueExpenses(new Date('2026-03-02T00:00:00.000Z'))

    expect(result.createdCount).toBe(0)
    expect(result.skippedCount).toBe(1)
  })
})
