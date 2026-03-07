import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({
  getHouseholdMembers: vi.fn(),
  getMemberRole: vi.fn(),
  updateMemberSalary: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getHouseholdMembers, getMemberRole, updateMemberSalary } from '@/services/member.service'
import { GET, PATCH } from '../route'

const mockSession = {
  user: { id: 'user-1', email: 'test@e.com' },
  expires: new Date().toISOString(),
}

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }

describe('GET /api/households/[id]/members', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return member list for authenticated household member', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getHouseholdMembers).mockResolvedValue([
      { id: 'm-1', userId: 'user-1', role: 'owner', salary: 5000, user: { name: 'Owner' } },
    ] as any)

    const req = {} as any
    const res = await GET(req, routeContext)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })
})

describe('PATCH /api/households/[id]/members', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should allow user to update their own salary', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(updateMemberSalary).mockResolvedValue({ salary: 6000 } as any)

    const req = {
      json: () => Promise.resolve({ salary: 6000, effectiveFrom: '2026-04-01' }),
    } as any
    const res = await PATCH(req, routeContext)
    expect(res.status).toBe(200)
    expect(updateMemberSalary).toHaveBeenCalledWith('hh-1', 'user-1', 6000, '2026-04-01')
  })
})
