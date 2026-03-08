import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    recurringExpense: {
      findFirst: vi.fn(),
    },
  },
}))
vi.mock('@/services/recurring.service', () => ({
  updateRecurringExpense: vi.fn(),
  deleteRecurringExpense: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMemberRole } from '@/services/member.service'
import { deleteRecurringExpense, updateRecurringExpense } from '@/services/recurring.service'
import { DELETE, PATCH } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1', recurringId: 'r-1' }) }
const session = {
  user: { id: 'u1', email: 'u@test.com' },
  expires: new Date().toISOString(),
}

describe('PATCH /api/households/[id]/recurring/[recurringId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates recurring expense for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue({ id: 'r-1' } as any)
    vi.mocked(updateRecurringExpense).mockResolvedValue({ id: 'r-1' } as any)

    const req = { json: () => Promise.resolve({ active: false }) } as any
    const res = await PATCH(req, routeContext)

    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/households/[id]/recurring/[recurringId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deletes recurring expense for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(prisma.recurringExpense.findFirst).mockResolvedValue({ id: 'r-1' } as any)
    vi.mocked(deleteRecurringExpense).mockResolvedValue(undefined)

    const res = await DELETE({} as any, routeContext)

    expect(res.status).toBe(204)
  })
})
