import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { getMemberRole } from '@/services/member.service'
import { deleteRecurringExpense, updateRecurringExpense } from '@/services/recurring.service'

type RouteContext = { params: Promise<{ id: string; recurringId: string }> }

async function belongsToHousehold(householdId: string, recurringId: string) {
  const recurring = await prisma.recurringExpense.findFirst({
    where: { id: recurringId, householdId },
    select: { id: true },
  })
  return Boolean(recurring)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, recurringId } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }
  if (!await belongsToHousehold(id, recurringId)) {
    return jsonResponse({ error: 'Recurring expense not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const recurring = await updateRecurringExpense(recurringId, body)
    return jsonResponse(recurring)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, recurringId } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }
  if (!await belongsToHousehold(id, recurringId)) {
    return jsonResponse({ error: 'Recurring expense not found' }, { status: 404 })
  }

  await deleteRecurringExpense(recurringId)
  return new Response(null, { status: 204 })
}
