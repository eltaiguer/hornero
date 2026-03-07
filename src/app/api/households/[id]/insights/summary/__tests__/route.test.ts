import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/insights.service', () => ({ getMonthlySummary: vi.fn() }))

import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { getMonthlySummary } from '@/services/insights.service'
import { GET } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = { user: { id: 'u1', email: 'u@test.com' }, expires: new Date().toISOString() }

describe('GET /api/households/[id]/insights/summary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns summary for household member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getMonthlySummary).mockResolvedValue({ totalSpent: 100 } as any)

    const req = new Request('http://localhost/api/households/hh-1/insights/summary?month=3&year=2026')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
  })
})
