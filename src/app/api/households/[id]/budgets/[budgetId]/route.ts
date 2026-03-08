import { auth } from '@/lib/auth'
import { isHouseholdOwner } from '@/services/member.service'
import { deleteBudget } from '@/services/budget.service'
import { jsonResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string; budgetId: string }> }

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, budgetId } = await params
  const owner = await isHouseholdOwner(id, session.user.id)

  if (!owner) {
    return jsonResponse({ error: 'Only the owner can delete budgets' }, { status: 403 })
  }

  const budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      householdId: id,
    },
    select: { id: true },
  })

  if (!budget) {
    return jsonResponse({ error: 'Budget not found' }, { status: 404 })
  }

  await deleteBudget(budgetId)
  return new Response(null, { status: 204 })
}
