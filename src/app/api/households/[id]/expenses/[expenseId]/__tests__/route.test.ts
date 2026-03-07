import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ isHouseholdOwner: vi.fn() }))
vi.mock('@/services/expense.service', () => ({
  getExpenseById: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { deleteExpense, getExpenseById, updateExpense } from '@/services/expense.service'
import { isHouseholdOwner } from '@/services/member.service'
import { DELETE, GET, PATCH } from '../route'

const routeContext = {
  params: Promise.resolve({ id: 'hh-1', expenseId: 'exp-1' }),
}
const session = {
  user: { id: 'user-1', email: 'user@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/expenses/[expenseId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 for missing expense', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getExpenseById).mockResolvedValue(null)

    const res = await GET({} as any, routeContext)

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/households/[id]/expenses/[expenseId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows payer to update expense', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getExpenseById).mockResolvedValue({ id: 'exp-1', householdId: 'hh-1', payerId: 'user-1' } as any)
    vi.mocked(updateExpense).mockResolvedValue({ id: 'exp-1' } as any)

    const req = { json: () => Promise.resolve({ description: 'Updated' }) } as any
    const res = await PATCH(req, routeContext)

    expect(res.status).toBe(200)
  })

  it('rejects non-payer non-owner', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getExpenseById).mockResolvedValue({ id: 'exp-1', householdId: 'hh-1', payerId: 'user-2' } as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const req = { json: () => Promise.resolve({ description: 'Updated' }) } as any
    const res = await PATCH(req, routeContext)

    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/households/[id]/expenses/[expenseId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows owner to delete expense', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getExpenseById).mockResolvedValue({ id: 'exp-1', householdId: 'hh-1', payerId: 'user-2' } as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(true)
    vi.mocked(deleteExpense).mockResolvedValue(undefined)

    const res = await DELETE({} as any, routeContext)

    expect(res.status).toBe(204)
    expect(deleteExpense).toHaveBeenCalledWith('exp-1')
  })
})
