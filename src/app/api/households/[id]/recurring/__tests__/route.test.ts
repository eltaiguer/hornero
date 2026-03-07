import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/recurring.service', () => ({
  createRecurringExpense: vi.fn(),
  getRecurringExpenses: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { createRecurringExpense, getRecurringExpenses } from '@/services/recurring.service'
import { GET, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = {
  user: { id: 'u1', email: 'u@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/recurring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns recurring list for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getRecurringExpenses).mockResolvedValue([{ id: 'r-1' }] as any)

    const res = await GET({} as any, routeContext)
    expect(res.status).toBe(200)
  })
})

describe('POST /api/households/[id]/recurring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates recurring expense for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(createRecurringExpense).mockResolvedValue({ id: 'r-1' } as any)

    const req = {
      json: () =>
        Promise.resolve({
          amount: 100,
          description: 'Rent',
          categoryId: 'cat-1',
          splitMethod: 'equal',
          frequency: 'monthly',
          startDate: '2026-03-01T00:00:00.000Z',
        }),
    } as any

    const res = await POST(req, routeContext)
    expect(res.status).toBe(201)
  })
})
