import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/push.service', () => ({
  sendDailyPaymentReminders: vi.fn(),
}))

import { sendDailyPaymentReminders } from '@/services/push.service'
import { POST } from '../route'

describe('POST /api/cron/payment-reminders', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 with invalid cron secret', async () => {
    process.env.CRON_SECRET = 'top-secret'
    const req = new Request('http://localhost/api/cron/payment-reminders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'wrong' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('sends reminders with valid cron secret', async () => {
    process.env.CRON_SECRET = 'top-secret'
    vi.mocked(sendDailyPaymentReminders).mockResolvedValue({ households: 1, attempted: 1, sent: 0 } as any)

    const req = new Request('http://localhost/api/cron/payment-reminders', {
      method: 'POST',
      headers: { 'x-cron-secret': 'top-secret' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const payload = await res.json()
    expect(payload.households).toBe(1)
  })
})
