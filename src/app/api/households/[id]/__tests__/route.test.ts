import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/household.service', () => ({
  getHouseholdById: vi.fn(),
  updateHouseholdSettings: vi.fn(),
}))
vi.mock('@/services/member.service', () => ({
  getMemberRole: vi.fn(),
  isHouseholdOwner: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getHouseholdById, updateHouseholdSettings } from '@/services/household.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'
import { GET, PATCH } from '../route'

const mockSession = {
  user: { id: 'user-1', email: 'test@e.com', name: 'Test' },
  expires: new Date().toISOString(),
}

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }

describe('GET /api/households/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)
    const req = {} as any
    const res = await GET(req, routeContext)
    expect(res.status).toBe(401)
  })

  it('should return 403 when user is not a member', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(getMemberRole).mockResolvedValue(null)
    const req = {} as any
    const res = await GET(req, routeContext)
    expect(res.status).toBe(403)
  })

  it('should return household data for a member', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getHouseholdById).mockResolvedValue({
      id: 'hh-1',
      name: 'Family',
      members: [],
    } as any)

    const req = {} as any
    const res = await GET(req, routeContext)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Family')
  })
})

describe('PATCH /api/households/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should return 403 when user is not owner', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const req = {
      json: () => Promise.resolve({ name: 'New Name' }),
    } as any
    const res = await PATCH(req, routeContext)
    expect(res.status).toBe(403)
  })

  it('should update settings when user is owner', async () => {
    vi.mocked(auth).mockResolvedValue(mockSession as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(updateHouseholdSettings).mockResolvedValue({
      id: 'hh-1',
      name: 'New Name',
    } as any)

    const req = {
      json: () => Promise.resolve({ name: 'New Name' }),
    } as any
    const res = await PATCH(req, routeContext)
    expect(res.status).toBe(200)
  })
})
