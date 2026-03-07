import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSettlement, getSettlements } from '../settlement.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    householdMember: { findMany: vi.fn() },
    settlement: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('SettlementService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a settlement when payer and receiver are household members', async () => {
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as any)
    vi.mocked(prisma.settlement.create).mockResolvedValue({ id: 'st-1', amount: 20 } as any)

    const result = await createSettlement('hh-1', 'u2', {
      receiverId: 'u1',
      amount: 20,
      note: 'Partial settle',
    })

    expect(result.id).toBe('st-1')
  })

  it('rejects settlement when receiver is not household member', async () => {
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as any)

    await expect(
      createSettlement('hh-1', 'u2', { receiverId: 'u3', amount: 20 })
    ).rejects.toThrow('Receiver must be a household member')
  })

  it('lists settlements by descending date', async () => {
    vi.mocked(prisma.settlement.findMany).mockResolvedValue([{ id: 'st-1' }] as any)

    const result = await getSettlements('hh-1')

    expect(result).toHaveLength(1)
    expect(prisma.settlement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { householdId: 'hh-1' },
        orderBy: { date: 'desc' },
      })
    )
  })
})
