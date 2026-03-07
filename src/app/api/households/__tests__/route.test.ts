import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/services/household.service', () => ({
  createHousehold: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { createHousehold } from '@/services/household.service'
import { POST } from '../route'

// Minimal NextRequest mock for testing
function createRequest(body: object) {
  return {
    json: () => Promise.resolve(body),
  } as any
}

describe('POST /api/households', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    const response = await POST(createRequest({ name: 'Family' }))
    expect(response.status).toBe(401)
  })

  it('should create household and return 201', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@e.com', name: 'Test' },
      expires: new Date().toISOString(),
    } as any)

    vi.mocked(createHousehold).mockResolvedValue({
      id: 'hh-1',
      name: 'Family',
      currency: 'USD',
      defaultSplitMethod: 'equal',
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const response = await POST(createRequest({ name: 'Family', currency: 'USD' }))
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.name).toBe('Family')
  })

  it('should return 400 for invalid input', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@e.com', name: 'Test' },
      expires: new Date().toISOString(),
    } as any)

    vi.mocked(createHousehold).mockRejectedValue(new Error('Validation error'))

    const response = await POST(createRequest({ name: '' }))
    expect(response.status).toBe(400)
  })
})
