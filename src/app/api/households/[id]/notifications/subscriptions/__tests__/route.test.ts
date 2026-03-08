import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/push.service', () => ({
  registerPushSubscription: vi.fn(),
  removePushSubscription: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { registerPushSubscription, removePushSubscription } from '@/services/push.service'
import { DELETE, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = {
  user: { id: 'u1', email: 'u@test.com' },
  expires: new Date().toISOString(),
}

describe('POST /api/households/[id]/notifications/subscriptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for unauthenticated users', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const req = new Request('http://localhost/api/households/hh-1/notifications/subscriptions', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(401)
  })

  it('registers subscription for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(registerPushSubscription).mockResolvedValue({ id: 'sub-1' } as any)

    const req = new Request('http://localhost/api/households/hh-1/notifications/subscriptions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: 'https://push.example/sub',
          keys: { p256dh: 'k1', auth: 'k2' },
        },
      }),
    })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(201)
  })
})

describe('DELETE /api/households/[id]/notifications/subscriptions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes subscription endpoint for member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(removePushSubscription).mockResolvedValue({ count: 1 } as any)

    const req = new Request('http://localhost/api/households/hh-1/notifications/subscriptions', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ endpoint: 'https://push.example/sub' }),
    })
    const res = await DELETE(req, routeContext)
    expect(res.status).toBe(204)
  })
})
