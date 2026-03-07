import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getMemberRole } from '@/services/member.service'
import { createRecurringExpense, getRecurringExpenses } from '@/services/recurring.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  const recurring = await getRecurringExpenses(id)
  return jsonResponse(recurring)
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const recurring = await createRecurringExpense(id, session.user.id, body)
    return jsonResponse(recurring, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
