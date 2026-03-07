import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { createExpense, getExpenses } from '@/services/expense.service'
import { getMemberRole } from '@/services/member.service'

type RouteContext = { params: Promise<{ id: string }> }

function parseExpenseFilters(url: string) {
  const search = new URL(url).searchParams

  const parseNumber = (value: string | null) => {
    if (value === null || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  return {
    dateFrom: search.get('dateFrom') ?? undefined,
    dateTo: search.get('dateTo') ?? undefined,
    categoryId: search.get('categoryId') ?? undefined,
    payerId: search.get('payerId') ?? undefined,
    minAmount: parseNumber(search.get('minAmount')),
    maxAmount: parseNumber(search.get('maxAmount')),
    page: parseNumber(search.get('page')),
    pageSize: parseNumber(search.get('pageSize')),
  }
}

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

  try {
    const expenses = await getExpenses(id, parseExpenseFilters(request.url))
    return jsonResponse(expenses)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
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
    const expense = await createExpense(id, body, session.user.id)
    return jsonResponse(expense, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
