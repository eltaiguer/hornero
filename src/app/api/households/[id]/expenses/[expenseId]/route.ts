import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { deleteExpense, getExpenseById, updateExpense } from '@/services/expense.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'

type RouteContext = { params: Promise<{ id: string; expenseId: string }> }

async function canModifyExpense(householdId: string, expenseId: string, userId: string) {
  const expense = await getExpenseById(expenseId)
  if (!expense || expense.householdId !== householdId) {
    return { allowed: false, notFound: true }
  }

  if (expense.payerId === userId) {
    return { allowed: true, expense }
  }

  const owner = await isHouseholdOwner(householdId, userId)
  return { allowed: owner, expense }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, expenseId } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  const expense = await getExpenseById(expenseId)

  if (!expense || expense.householdId !== id) {
    return jsonResponse({ error: 'Expense not found' }, { status: 404 })
  }

  return jsonResponse(expense)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, expenseId } = await params
  const permission = await canModifyExpense(id, expenseId, session.user.id)

  if ('notFound' in permission && permission.notFound) {
    return jsonResponse({ error: 'Expense not found' }, { status: 404 })
  }

  if (!permission.allowed) {
    return jsonResponse({ error: 'Only payer or owner can update this expense' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const updated = await updateExpense(expenseId, body)
    return jsonResponse(updated)
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

  const { id, expenseId } = await params
  const permission = await canModifyExpense(id, expenseId, session.user.id)

  if ('notFound' in permission && permission.notFound) {
    return jsonResponse({ error: 'Expense not found' }, { status: 404 })
  }

  if (!permission.allowed) {
    return jsonResponse({ error: 'Only payer or owner can delete this expense' }, { status: 403 })
  }

  await deleteExpense(expenseId)
  return new Response(null, { status: 204 })
}
