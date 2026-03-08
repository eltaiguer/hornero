import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { isHouseholdOwner } from '@/services/member.service'
import { clearReceipt, uploadReceipt } from '@/services/receipt.service'

type RouteContext = { params: Promise<{ id: string }> }

async function authorizeForReceiptExpense(expenseId: string, userId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { id: true, householdId: true, payerId: true },
  })

  if (!expense) {
    return { allowed: false as const, status: 404 as const, message: 'Expense not found' }
  }

  if (expense.payerId === userId) {
    return { allowed: true as const, expense }
  }

  const owner = await isHouseholdOwner(expense.householdId, userId)
  if (!owner) {
    return { allowed: false as const, status: 403 as const, message: 'Only payer or owner can update receipt' }
  }

  return { allowed: true as const, expense }
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const permission = await authorizeForReceiptExpense(id, session.user.id)
  if (!permission.allowed) {
    return jsonResponse({ error: permission.message }, { status: permission.status })
  }

  const formData = await request.formData()
  const maybeFile = formData.get('file')

  if (!maybeFile || typeof (maybeFile as Blob).arrayBuffer !== 'function') {
    return jsonResponse({ error: 'file is required' }, { status: 400 })
  }

  try {
    const updated = await uploadReceipt(id, maybeFile as Blob & { name?: string })
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

  const { id } = await params
  const permission = await authorizeForReceiptExpense(id, session.user.id)
  if (!permission.allowed) {
    return jsonResponse({ error: permission.message }, { status: permission.status })
  }

  await clearReceipt(id)
  return new Response(null, { status: 204 })
}
