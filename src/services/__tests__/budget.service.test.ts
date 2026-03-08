import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkBudgetAlerts,
  deleteBudget,
  getBudgetProgress,
  getBudgets,
  setBudget,
} from '../budget.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findFirst: vi.fn() },
    budget: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    expense: { groupBy: vi.fn() },
  },
}))

describe('BudgetService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts budget by household/category/month/year', async () => {
    vi.mocked(prisma.category.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
    vi.mocked(prisma.budget.upsert).mockResolvedValue({ id: 'b-1', amount: 500 } as any)

    const result = await setBudget('hh-1', {
      categoryId: 'cat-1',
      month: 3,
      year: 2026,
      amount: 500,
    })

    expect(result.id).toBe('b-1')
  })

  it('gets budgets for month and year', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([{ id: 'b-1' }] as any)

    const result = await getBudgets('hh-1', 3, 2026)

    expect(result).toHaveLength(1)
  })

  it('computes budget progress with actual spend totals', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { id: 'b-1', amount: 500, categoryId: 'cat-1', category: { name: 'Groceries', emoji: '🛒' } },
    ] as any)
    vi.mocked(prisma.expense.groupBy).mockResolvedValue([
      { categoryId: 'cat-1', _sum: { amount: 320 } },
    ] as any)

    const result = await getBudgetProgress('hh-1', 3, 2026)

    expect(result).toEqual([
      {
        budgetId: 'b-1',
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        categoryEmoji: '🛒',
        budgetAmount: 500,
        actualSpent: 320,
        percentage: 64,
      },
    ])
  })

  it('returns alerts for 80% and 100% thresholds', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { id: 'b-1', amount: 500, categoryId: 'cat-1', category: { name: 'Groceries', emoji: '🛒' } },
    ] as any)
    vi.mocked(prisma.expense.groupBy).mockResolvedValue([
      { categoryId: 'cat-1', _sum: { amount: 450 } },
    ] as any)

    const result = await checkBudgetAlerts('hh-1', 3, 2026)

    expect(result[0].level).toBe('warning')
  })

  it('deletes budget by id', async () => {
    vi.mocked(prisma.budget.delete).mockResolvedValue({ id: 'b-1' } as any)

    await deleteBudget('b-1')

    expect(prisma.budget.delete).toHaveBeenCalledWith({ where: { id: 'b-1' } })
  })
})
