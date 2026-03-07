import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getMemberRole } from '@/services/member.service'
import { deleteRecurringExpense, updateRecurringExpense } from '@/services/recurring.service'

type RouteContext = { params: Promise<{ id: string; recurringId: string }> }

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

  await deleteRecurringExpense(recurringId)
  return new Response(null, { status: 204 })
}
