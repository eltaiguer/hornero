import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ isHouseholdOwner: vi.fn() }))
vi.mock('@/services/invite.service', () => ({ createInvite: vi.fn() }))

import { auth } from '@/lib/auth'
import { isHouseholdOwner } from '@/services/member.service'
import { createInvite } from '@/services/invite.service'
import { POST } from '../route'

const mockSession = {
  user: { id: 'user-1', email: 'owner@e.com' },
  expires: new Date().toISOString(),
}
const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }

describe('POST /api/households/[id]/invite', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 403 when non-owner tries to invite', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const req = {
      json: () => Promise.resolve({ email: 'new@e.com' }),
    } as any
    const res = await POST(req, routeContext)
    expect(res.status).toBe(403)
  })

  it('should create invite when owner invites valid email', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(createInvite).mockResolvedValue({
      id: 'inv-1',
      token: 'abc',
      email: 'new@e.com',
    } as any)

    const req = {
      json: () => Promise.resolve({ email: 'new@e.com' }),
    } as any
    const res = await POST(req, routeContext)
    expect(res.status).toBe(201)
  })
})
