import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/settlement.service', () => ({
  createSettlement: vi.fn(),
  getSettlements: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { createSettlement, getSettlements } from '@/services/settlement.service'
import { GET, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = {
  user: { id: 'user-1', email: 'user@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/settlements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns settlement history for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getSettlements).mockResolvedValue([{ id: 'st-1' }] as any)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(200)
  })
})

describe('POST /api/households/[id]/settlements', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue(null)

    const req = { json: () => Promise.resolve({}) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(403)
  })

  it('creates settlement for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(createSettlement).mockResolvedValue({ id: 'st-1' } as any)

    const req = { json: () => Promise.resolve({ receiverId: 'u2', amount: 25 }) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(201)
    expect(createSettlement).toHaveBeenCalledWith('hh-1', 'user-1', { receiverId: 'u2', amount: 25 })
  })
})
