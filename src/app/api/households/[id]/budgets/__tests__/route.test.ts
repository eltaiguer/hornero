import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn(), isHouseholdOwner: vi.fn() }))
vi.mock('@/services/budget.service', () => ({
  getBudgetProgress: vi.fn(),
  setBudget: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'
import { getBudgetProgress, setBudget } from '@/services/budget.service'
import { GET, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = {
  user: { id: 'user-1', email: 'u@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/budgets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns budget progress for household member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getBudgetProgress).mockResolvedValue([{ categoryId: 'cat-1' }] as any)

    const req = new Request('http://localhost/api/households/hh-1/budgets?month=3&year=2026')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
  })
})

describe('POST /api/households/[id]/budgets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-owner', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const req = { json: () => Promise.resolve({}) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(403)
  })

  it('upserts budget for owner', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(setBudget).mockResolvedValue({ id: 'b-1' } as any)

    const req = {
      json: () => Promise.resolve({ categoryId: 'cat-1', month: 3, year: 2026, amount: 500 }),
    } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(201)
  })
})
