import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/recurring.service', () => ({
  processDueExpenses: vi.fn(),
}))

import { processDueExpenses } from '@/services/recurring.service'
import { POST } from '../route'

describe('POST /api/cron/recurring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 with invalid cron secret', async () => {
    const req = new Request('http://localhost/api/cron/recurring', {
      method: 'POST',
      headers: { 'x-cron-secret': 'wrong' },
    })

    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('processes due expenses with valid secret', async () => {
    process.env.CRON_SECRET = 'top-secret'
    vi.mocked(processDueExpenses).mockResolvedValue({ createdCount: 2 } as any)

    const req = new Request('http://localhost/api/cron/recurring', {
      method: 'POST',
      headers: { 'x-cron-secret': 'top-secret' },
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.createdCount).toBe(2)
  })
})
