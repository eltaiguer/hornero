import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    householdMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    pushSubscription: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    notificationDispatch: {
      create: vi.fn(),
    },
  },
}))
vi.mock('@/lib/push-client', () => ({
  sendPushNotification: vi.fn(),
}))
vi.mock('../budget.service', () => ({
  checkBudgetAlerts: vi.fn(),
}))
vi.mock('../balance.service', () => ({
  calculateBalances: vi.fn(),
  getSimplifiedDebts: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push-client'
import { checkBudgetAlerts } from '../budget.service'
import { calculateBalances, getSimplifiedDebts } from '../balance.service'
import {
  notifyBudgetThresholds,
  notifyPaymentReminders,
  registerPushSubscription,
  removePushSubscription,
} from '../push.service'

describe('PushService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registers subscription for household member', async () => {
    vi.mocked(prisma.householdMember.findUnique).mockResolvedValue({ userId: 'u1' } as any)
    vi.mocked(prisma.pushSubscription.upsert).mockResolvedValue({ id: 'sub-1' } as any)

    const result = await registerPushSubscription('hh-1', 'u1', {
      endpoint: 'https://push.example/sub',
      keys: { p256dh: 'k1', auth: 'k2' },
    })

    expect(result.id).toBe('sub-1')
    expect(prisma.pushSubscription.upsert).toHaveBeenCalled()
  })

  it('removes subscription endpoint for a user in household', async () => {
    vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({ count: 1 } as any)

    const result = await removePushSubscription('hh-1', 'u1', 'https://push.example/sub')

    expect(result.count).toBe(1)
  })

  it('computes budget notification attempts with dedupe', async () => {
    vi.mocked(checkBudgetAlerts).mockResolvedValue([
      { categoryId: 'cat-1', categoryName: 'Groceries', percentage: 85, level: 'warning' },
    ] as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }] as any)
    vi.mocked(prisma.notificationDispatch.create).mockResolvedValue({ id: 'n1' } as any)
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([] as any)
    vi.mocked(sendPushNotification).mockResolvedValue({ ok: false, stale: false })

    const result = await notifyBudgetThresholds('hh-1', 3, 2026)

    expect(result.attempted).toBe(2)
    expect(result.sent).toBe(0)
  })

  it('computes payment reminder attempts from simplified debts', async () => {
    vi.mocked(calculateBalances).mockResolvedValue([
      { userId: 'u1', balance: -10 },
      { userId: 'u2', balance: 10 },
    ] as any)
    vi.mocked(getSimplifiedDebts).mockReturnValue([
      { fromUserId: 'u1', toUserId: 'u2', amount: 10 },
    ] as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([
      { userId: 'u1', user: { name: 'A', email: 'a@test.com' } },
      { userId: 'u2', user: { name: 'B', email: 'b@test.com' } },
    ] as any)
    vi.mocked(prisma.notificationDispatch.create).mockResolvedValue({ id: 'n1' } as any)
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([] as any)
    vi.mocked(sendPushNotification).mockResolvedValue({ ok: false, stale: false })

    const result = await notifyPaymentReminders('hh-1', new Date('2026-03-10T00:00:00.000Z'))

    expect(result.attempted).toBe(1)
  })

  it('counts sent notifications when delivery succeeds', async () => {
    vi.mocked(checkBudgetAlerts).mockResolvedValue([
      { categoryId: 'cat-1', categoryName: 'Groceries', percentage: 85, level: 'warning' },
    ] as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([{ userId: 'u1' }] as any)
    vi.mocked(prisma.notificationDispatch.create).mockResolvedValue({ id: 'n1' } as any)
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      { id: 'sub-1', endpoint: 'https://push.example/sub', p256dh: 'k1', auth: 'k2' },
    ] as any)
    vi.mocked(sendPushNotification).mockResolvedValue({ ok: true, stale: false })

    const result = await notifyBudgetThresholds('hh-1', 3, 2026)

    expect(result.sent).toBe(1)
  })

  it('removes stale subscriptions when push service reports 410/404', async () => {
    vi.mocked(checkBudgetAlerts).mockResolvedValue([
      { categoryId: 'cat-1', categoryName: 'Groceries', percentage: 110, level: 'danger' },
    ] as any)
    vi.mocked(prisma.householdMember.findMany).mockResolvedValue([{ userId: 'u1' }] as any)
    vi.mocked(prisma.notificationDispatch.create).mockResolvedValue({ id: 'n1' } as any)
    vi.mocked(prisma.pushSubscription.findMany).mockResolvedValue([
      { id: 'sub-stale', endpoint: 'https://push.example/stale', p256dh: 'k1', auth: 'k2' },
    ] as any)
    vi.mocked(sendPushNotification).mockResolvedValue({ ok: false, stale: true })
    vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({ count: 1 } as any)

    await notifyBudgetThresholds('hh-1', 3, 2026)

    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { id: 'sub-stale' },
    })
  })
})
