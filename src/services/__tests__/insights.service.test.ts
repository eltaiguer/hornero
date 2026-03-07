import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getBudgetVsActual,
  getMemberBreakdown,
  getMonthlySummary,
  getSpendingByCategory,
  getSpendingTrend,
  getTopExpenses,
} from '../insights.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    budget: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('InsightsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns monthly summary with last-month and budget comparisons', async () => {
    vi.mocked(prisma.expense.aggregate)
      .mockResolvedValueOnce({ _sum: { amount: 600 } } as any)
      .mockResolvedValueOnce({ _sum: { amount: 400 } } as any)
    vi.mocked(prisma.budget.aggregate).mockResolvedValue({ _sum: { amount: 700 } } as any)

    const summary = await getMonthlySummary('hh-1', 3, 2026)

    expect(summary.totalSpent).toBe(600)
    expect(summary.vsLastMonthPct).toBe(50)
    expect(summary.vsBudgetPct).toBeCloseTo(85.71, 2)
  })

  it('returns spending by category percentages', async () => {
    vi.mocked(prisma.expense.groupBy).mockResolvedValue([
      { categoryId: 'cat-1', _sum: { amount: 300 } },
      { categoryId: 'cat-2', _sum: { amount: 100 } },
    ] as any)
    vi.mocked(prisma.category.findMany).mockResolvedValue([
      { id: 'cat-1', name: 'Groceries' },
      { id: 'cat-2', name: 'Transport' },
    ] as any)

    const result = await getSpendingByCategory('hh-1', 3, 2026)

    expect(result).toEqual([
      { categoryId: 'cat-1', category: 'Groceries', amount: 300, percentage: 75 },
      { categoryId: 'cat-2', category: 'Transport', amount: 100, percentage: 25 },
    ])
  })

  it('returns spending trend for requested months', async () => {
    vi.mocked(prisma.expense.groupBy).mockResolvedValue([
      { date: new Date('2026-01-10T00:00:00.000Z'), _sum: { amount: 100 } },
      { date: new Date('2026-02-10T00:00:00.000Z'), _sum: { amount: 200 } },
    ] as any)

    const trend = await getSpendingTrend('hh-1', 6)

    expect(trend.length).toBe(2)
    expect(trend[0].total).toBe(100)
  })

  it('returns member breakdown based on split amounts', async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      { splits: [{ userId: 'u1', amountOwed: 180 }, { userId: 'u2', amountOwed: 120 }] },
    ] as any)

    const breakdown = await getMemberBreakdown('hh-1', 3, 2026)

    expect(breakdown).toEqual([
      { userId: 'u1', amount: 180 },
      { userId: 'u2', amount: 120 },
    ])
  })

  it('returns top expenses by amount', async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      { id: 'e1', amount: 400 },
      { id: 'e2', amount: 200 },
    ] as any)

    const top = await getTopExpenses('hh-1', 3, 2026, 2)

    expect(top).toHaveLength(2)
    expect(top[0].id).toBe('e1')
  })

  it('returns budget vs actual records', async () => {
    vi.mocked(prisma.budget.findMany).mockResolvedValue([
      { categoryId: 'cat-1', amount: 500, category: { name: 'Groceries' } },
    ] as any)
    vi.mocked(prisma.expense.groupBy).mockResolvedValue([
      { categoryId: 'cat-1', _sum: { amount: 320 } },
    ] as any)
    vi.mocked(prisma.category.findMany).mockResolvedValue([{ id: 'cat-1', name: 'Groceries' }] as any)

    const data = await getBudgetVsActual('hh-1', 3, 2026)

    expect(data).toEqual([
      { categoryId: 'cat-1', category: 'Groceries', budget: 500, actual: 320 },
    ])
  })
})
