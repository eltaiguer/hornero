import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push-client'
import { checkBudgetAlerts } from './budget.service'
import { calculateBalances, getSimplifiedDebts } from './balance.service'

export interface PushSubscriptionInput {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10)
}

async function markDispatched(householdId: string, userId: string, eventKey: string) {
  try {
    await prisma.notificationDispatch.create({
      data: {
        householdId,
        userId,
        eventKey,
      },
    })
    return true
  } catch {
    return false
  }
}

async function sendToUserSubscriptions(
  householdId: string,
  userId: string,
  payload: unknown,
  eventKey: string
) {
  const shouldSend = await markDispatched(householdId, userId, eventKey)
  if (!shouldSend) {
    return { sent: 0, deduped: 1 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { householdId, userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  let sent = 0
  for (const sub of subscriptions) {
    const result = await sendPushNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      payload
    )

    if (result.ok) {
      sent += 1
      continue
    }

    if (result.stale) {
      await prisma.pushSubscription.deleteMany({
        where: { id: sub.id },
      })
    }
  }

  return { sent, deduped: 0 }
}

export async function registerPushSubscription(
  householdId: string,
  userId: string,
  subscription: PushSubscriptionInput
) {
  const member = await prisma.householdMember.findUnique({
    where: { householdId_userId: { householdId, userId } },
    select: { userId: true },
  })
  if (!member) {
    throw new Error('Forbidden')
  }

  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      householdId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId,
      householdId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })
}

export async function removePushSubscription(
  householdId: string,
  userId: string,
  endpoint: string
) {
  return prisma.pushSubscription.deleteMany({
    where: {
      householdId,
      userId,
      endpoint,
    },
  })
}

export async function notifyBudgetThresholds(householdId: string, month: number, year: number) {
  const [alerts, members] = await Promise.all([
    checkBudgetAlerts(householdId, month, year),
    prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true },
    }),
  ])

  if (!alerts.length || !members.length) {
    return { attempted: 0, sent: 0 }
  }

  let attempted = 0
  let sent = 0
  for (const alert of alerts) {
    for (const member of members) {
      attempted += 1
      const eventKey = `budget:${year}-${String(month).padStart(2, '0')}:${alert.categoryId}:${alert.level}`
      const payload = {
        title: alert.level === 'danger' ? 'Budget exceeded' : 'Budget warning',
        body: alert.level === 'danger'
          ? `${alert.categoryName} is over budget`
          : `${alert.categoryName} reached ${alert.percentage.toFixed(0)}%`,
        data: { householdId, month, year, categoryId: alert.categoryId },
      }
      const result = await sendToUserSubscriptions(householdId, member.userId, payload, eventKey)
      sent += result.sent
    }
  }

  return { attempted, sent }
}

export async function notifyPaymentReminders(householdId: string, now = new Date()) {
  const [balances, members] = await Promise.all([
    calculateBalances(householdId),
    prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true, user: { select: { name: true, email: true } } },
    }),
  ])
  const debts = getSimplifiedDebts(balances)

  if (!debts.length) {
    return { attempted: 0, sent: 0 }
  }

  const nameByUser = new Map(
    members.map((member) => [member.userId, member.user.name ?? member.user.email ?? 'Member'])
  )

  let attempted = 0
  let sent = 0
  for (const debt of debts) {
    attempted += 1
    const eventKey = `payment:${todayKey(now)}:${debt.fromUserId}:${debt.toUserId}:${debt.amount.toFixed(2)}`
    const payload = {
      title: 'Payment reminder',
      body: `You owe ${nameByUser.get(debt.toUserId) ?? 'a member'} $${debt.amount.toFixed(2)}`,
      data: { householdId, fromUserId: debt.fromUserId, toUserId: debt.toUserId, amount: debt.amount },
    }
    const result = await sendToUserSubscriptions(householdId, debt.fromUserId, payload, eventKey)
    sent += result.sent
  }

  return { attempted, sent }
}

export async function sendDailyPaymentReminders(now = new Date()) {
  const households = await prisma.pushSubscription.findMany({
    distinct: ['householdId'],
    select: { householdId: true },
  })

  let attempted = 0
  let sent = 0
  for (const row of households) {
    const result = await notifyPaymentReminders(row.householdId, now)
    attempted += result.attempted
    sent += result.sent
  }

  return { households: households.length, attempted, sent }
}
