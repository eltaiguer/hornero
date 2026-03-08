import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ isHouseholdOwner: vi.fn() }))
vi.mock('@/services/budget.service', () => ({ deleteBudget: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    budget: {
      findFirst: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isHouseholdOwner } from '@/services/member.service'
import { deleteBudget } from '@/services/budget.service'
import { DELETE } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1', budgetId: 'b-1' }) }
const session = {
  user: { id: 'user-1', email: 'u@test.com' },
  expires: new Date().toISOString(),
}

describe('DELETE /api/households/[id]/budgets/[budgetId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows owner to delete budget', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(prisma.budget.findFirst).mockResolvedValue({ id: 'b-1' } as any)
    vi.mocked(deleteBudget).mockResolvedValue(undefined)

    const res = await DELETE({} as any, routeContext)

    expect(res.status).toBe(204)
    expect(deleteBudget).toHaveBeenCalledWith('b-1')
  })

  it('returns 404 when budget does not belong to household', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(prisma.budget.findFirst).mockResolvedValue(null)

    const res = await DELETE({} as any, routeContext)

    expect(res.status).toBe(404)
    expect(deleteBudget).not.toHaveBeenCalled()
  })
})
