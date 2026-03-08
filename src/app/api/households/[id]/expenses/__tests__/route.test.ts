import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/member.service', () => ({ getMemberRole: vi.fn() }))
vi.mock('@/services/expense.service', () => ({
  getExpenses: vi.fn(),
  createExpense: vi.fn(),
}))
vi.mock('@/services/receipt.service', () => ({
  uploadReceipt: vi.fn(),
}))

import { auth } from '@/lib/auth'
import { createExpense, getExpenses } from '@/services/expense.service'
import { uploadReceipt } from '@/services/receipt.service'
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

  it('creates expense with multipart payload and attaches receipt', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(createExpense).mockResolvedValue({ id: 'exp-1' } as any)
    vi.mocked(uploadReceipt).mockResolvedValue({ id: 'exp-1', receiptUrl: '/uploads/r.jpg' } as any)

    const file = new File(['receipt'], 'receipt.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.set('amount', '100')
    formData.set('description', 'Groceries')
    formData.set('date', '2026-03-01T00:00:00.000Z')
    formData.set('categoryId', 'cat-1')
    formData.set('splitMethod', 'equal')
    formData.set('file', file)

    const req = new Request('http://localhost/api/households/hh-1/expenses', {
      method: 'POST',
      body: formData,
    })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(201)
    expect(createExpense).toHaveBeenCalledWith(
      'hh-1',
      expect.objectContaining({ amount: 100, description: 'Groceries' }),
      'user-1'
    )
    expect(uploadReceipt).toHaveBeenCalledTimes(1)
    const [uploadedExpenseId, uploadedFile] = vi.mocked(uploadReceipt).mock.calls[0]!
    expect(uploadedExpenseId).toBe('exp-1')
    expect(uploadedFile).toBeTruthy()
    expect(typeof (uploadedFile as Blob).arrayBuffer).toBe('function')
  })

  it('returns 400 when multipart payload is invalid', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(getMemberRole).mockResolvedValue('member')
    vi.mocked(createExpense).mockRejectedValue(new Error('Description is required'))

    const formData = new FormData()
    formData.set('amount', '100')
    formData.set('splitMethod', 'equal')
    const req = new Request('http://localhost/api/households/hh-1/expenses', {
      method: 'POST',
      body: formData,
    })

    const res = await POST(req, routeContext)

    expect(res.status).toBe(400)
  })
})
