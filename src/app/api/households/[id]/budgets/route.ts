import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getBudgetProgress, setBudget } from '@/services/budget.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  const search = new URL(request.url).searchParams
  const month = Number(search.get('month') ?? new Date().getUTCMonth() + 1)
  const year = Number(search.get('year') ?? new Date().getUTCFullYear())

  const progress = await getBudgetProgress(id, month, year)
  return jsonResponse(progress)
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const owner = await isHouseholdOwner(id, session.user.id)
  if (!owner) {
    return jsonResponse({ error: 'Only the owner can manage budgets' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const budget = await setBudget(id, body)
    return jsonResponse(budget, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
