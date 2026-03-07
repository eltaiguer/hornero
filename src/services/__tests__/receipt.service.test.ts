import { beforeEach, describe, expect, it, vi } from 'vitest'
import { uploadReceipt } from '../receipt.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      update: vi.fn(),
    },
  },
}))

describe('ReceiptService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('writes receipt file and updates expense receiptUrl', async () => {
    vi.mocked(prisma.expense.update).mockResolvedValue({ id: 'exp-1', receiptUrl: '/uploads/test.png' } as any)

    const file = Object.assign(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }), {
      name: 'receipt.png',
    })
    const result = await uploadReceipt('exp-1', file)

    expect(result.receiptUrl).toContain('/uploads/')
    expect(prisma.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exp-1' },
        data: expect.objectContaining({ receiptUrl: expect.stringContaining('/uploads/') }),
      })
    )
  })
})
