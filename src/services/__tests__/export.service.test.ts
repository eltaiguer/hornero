import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportExpensesCsv } from '../export.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: { findMany: vi.fn() },
  },
}))

describe('ExportService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('exports expenses as CSV', async () => {
    vi.mocked(prisma.expense.findMany).mockResolvedValue([
      {
        id: 'e1',
        date: new Date('2026-03-01T00:00:00.000Z'),
        description: 'Groceries',
        amount: 120,
        category: { name: 'Groceries' },
        payer: { name: 'Alex', email: 'alex@test.com' },
      },
    ] as any)

    const csv = await exportExpensesCsv(
      'hh-1',
      new Date('2026-03-01T00:00:00.000Z'),
      new Date('2026-03-31T23:59:59.000Z')
    )

    expect(csv).toContain('date,description,amount,category,payer')
    expect(csv).toContain('Groceries')
    expect(csv).toContain('120.00')
  })
})
