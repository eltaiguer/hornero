import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/balance.service', () => ({
  calculateBalances: vi.fn(),
  getSimplifiedDebts: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { getMemberRole } from '@/services/member.service'
import { GET } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }

const session = {
  user: { id: 'user-1', email: 'user@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/balances', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for unauthenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(401)
  })

  it('returns balances and simplified debts', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(calculateBalances).mockResolvedValue([{ userId: 'u1', balance: 50 }] as any)
    vi.mocked(getSimplifiedDebts).mockReturnValue([] as any)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ balances: [{ userId: 'u1', balance: 50 }], simplifiedDebts: [] })
  })
})
