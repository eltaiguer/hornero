import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({
  getMemberRole: vi.fn(),
  isHouseholdOwner: vi.fn(),
}))
vi.mock('@/services/category.service', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { createCategory, getCategories } from '@/services/category.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'
import { GET, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }

const session = {
  user: { id: 'user-1', email: 'user@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/categories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(401)
  })

  it('returns category list for members', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getCategories).mockResolvedValue([{ id: 'cat-1' }] as any)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
  })
})

describe('POST /api/households/[id]/categories', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when non-owner creates category', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const req = { json: () => Promise.resolve({ name: 'Food' }) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(403)
  })

  it('creates category for owner', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(createCategory).mockResolvedValue({ id: 'cat-1' } as any)

    const req = { json: () => Promise.resolve({ name: 'Food' }) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(201)
    expect(createCategory).toHaveBeenCalledWith('hh-1', { name: 'Food' })
  })
})
