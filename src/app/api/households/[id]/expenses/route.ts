import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { createExpense, getExpenses } from '@/services/expense.service'
import { uploadReceipt } from '@/services/receipt.service'
import { getMemberRole } from '@/services/member.service'

type RouteContext = { params: Promise<{ id: string }> }

function parseExpenseFilters(url: string) {
  const search = new URL(url).searchParams

  const parseNumber = (value: string | null) => {
    if (value === null || value === '') return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const parseDate = (value: string | null) => {
    if (!value) return undefined
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  return {
    dateFrom: parseDate(search.get('dateFrom')),
    dateTo: parseDate(search.get('dateTo')),
    categoryId: search.get('categoryId') ?? undefined,
    payerId: search.get('payerId') ?? undefined,
    minAmount: parseNumber(search.get('minAmount')),
    maxAmount: parseNumber(search.get('maxAmount')),
    cursor: search.get('cursor') ?? undefined,
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
    const contentType = request.headers?.get?.('content-type') ?? ''

    let payload: unknown
    let receiptFile: (Blob & { name?: string }) | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      payload = parseExpensePayloadFromFormData(formData)
      receiptFile = parseReceiptFile(formData) ?? undefined
    } else {
      payload = await request.json()
    }

    const expense = await createExpense(id, payload as any, session.user.id)

    if (receiptFile) {
      const withReceipt = await uploadReceipt(expense.id, receiptFile)
      return jsonResponse(withReceipt, { status: 201 })
    }

    return jsonResponse(expense, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}

function parseExpensePayloadFromFormData(formData: FormData) {
  const getString = (key: string) => {
    const value = formData.get(key)
    return typeof value === 'string' ? value : ''
  }

  const payload: Record<string, unknown> = {
    amount: Number(getString('amount')),
    description: getString('description'),
    date: getString('date'),
    categoryId: getString('categoryId'),
    splitMethod: getString('splitMethod'),
  }

  const splitConfig = getString('splitConfig').trim()
  if (splitConfig) {
    payload.splitConfig = splitConfig
  }

  const notes = getString('notes').trim()
  if (notes) {
    payload.notes = notes
  }

  return payload
}

function parseReceiptFile(formData: FormData) {
  const value = formData.get('file')
  if (!value || typeof value === 'string') {
    return null
  }

  if (value.size === 0) {
    return null
  }

  return value as Blob & { name?: string }
}
