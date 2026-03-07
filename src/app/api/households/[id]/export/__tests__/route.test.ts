import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/export.service', () => ({ exportExpensesCsv: vi.fn() }))

import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { exportExpensesCsv } from '@/services/export.service'
import { GET } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = { user: { id: 'u1', email: 'u@test.com' }, expires: new Date().toISOString() }

describe('GET /api/households/[id]/export', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns CSV export for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(exportExpensesCsv).mockResolvedValue('date,description\n')

    const req = new Request('http://localhost/api/households/hh-1/export?from=2026-03-01&to=2026-03-31')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
  })
})
