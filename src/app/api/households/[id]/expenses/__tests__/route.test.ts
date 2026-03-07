import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/expense.service', () => ({
  getExpenses: vi.fn(),
  createExpense: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { createExpense, getExpenses } from '@/services/expense.service'
import { getMemberRole } from '@/services/member.service'
import { GET, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'hh-1' }) }
const session = {
  user: { id: 'user-1', email: 'user@test.com' },
  expires: new Date().toISOString(),
}

describe('GET /api/households/[id]/expenses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns expenses for members', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(getExpenses).mockResolvedValue({ items: [{ id: 'exp-1' }], total: 1, page: 1, pageSize: 20 } as any)

    const req = new Request('http://localhost/api/households/hh-1/expenses?page=1')
    const res = await GET(req, routeContext)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.total).toBe(1)
  })
})

describe('POST /api/households/[id]/expenses', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 for non-members', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue(null)

    const req = { json: () => Promise.resolve({}) } as any
    const res = await POST(req, routeContext)

    expect(res.status).toBe(403)
  })

  it('creates expense for household member', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(createExpense).mockResolvedValue({ id: 'exp-1' } as any)

    const req = {
      json: () =>
        Promise.resolve({
          amount: 100,
          description: 'Groceries',
          date: '2026-03-01T00:00:00.000Z',
          categoryId: 'cat-1',
          splitMethod: 'equal',
        }),
    } as any

    const res = await POST(req, routeContext)

    expect(res.status).toBe(201)
    expect(createExpense).toHaveBeenCalledWith(
      'hh-1',
      expect.objectContaining({ amount: 100 }),
      'user-1'
    )
  })
})
