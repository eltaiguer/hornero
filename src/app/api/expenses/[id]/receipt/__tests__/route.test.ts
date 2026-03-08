import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    expense: {
      findUnique: vi.fn(),
    },
  },
}))
vi.mock('@/services/member.service', () => ({ isHouseholdOwner: vi.fn() }))
vi.mock('@/services/receipt.service', () => ({ uploadReceipt: vi.fn(), clearReceipt: vi.fn() }))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isHouseholdOwner } from '@/services/member.service'
import { clearReceipt, uploadReceipt } from '@/services/receipt.service'
import { DELETE, POST } from '../route'

const routeContext = { params: Promise.resolve({ id: 'exp-1' }) }
const session = { user: { id: 'u1', email: 'u@test.com' }, expires: new Date().toISOString() }

describe('POST /api/expenses/[id]/receipt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 for unauthenticated user', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)

    const req = new Request('http://localhost/api/expenses/exp-1/receipt', { method: 'POST' })
    const res = await POST(req, routeContext)

    expect(res.status).toBe(401)
  })

  it('uploads receipt and returns updated expense', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({
      id: 'exp-1',
      householdId: 'hh-1',
      payerId: 'u1',
    } as any)
    vi.mocked(uploadReceipt).mockResolvedValue({ id: 'exp-1', receiptUrl: '/uploads/exp-1.png' } as any)

    const formData = new FormData()
    formData.append(
      'file',
      Object.assign(new Blob([new Uint8Array([1])], { type: 'image/png' }), { name: 'receipt.png' })
    )
    const req = new Request('http://localhost/api/expenses/exp-1/receipt', { method: 'POST', body: formData })

    const res = await POST(req, routeContext)

    expect(res.status).toBe(200)
    expect(uploadReceipt).toHaveBeenCalled()
  })

  it('returns 404 when expense does not exist', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(prisma.expense.findUnique).mockResolvedValue(null)

    const formData = new FormData()
    formData.append(
      'file',
      Object.assign(new Blob([new Uint8Array([1])], { type: 'image/png' }), { name: 'receipt.png' })
    )
    const req = new Request('http://localhost/api/expenses/missing/receipt', { method: 'POST', body: formData })

    const res = await POST(req, { params: Promise.resolve({ id: 'missing' }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 when member is neither owner nor payer', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({
      id: 'exp-1',
      householdId: 'hh-1',
      payerId: 'u2',
    } as any)
    vi.mocked(isHouseholdOwner).mockResolvedValue(false)

    const formData = new FormData()
    formData.append(
      'file',
      Object.assign(new Blob([new Uint8Array([1])], { type: 'image/png' }), { name: 'receipt.png' })
    )
    const req = new Request('http://localhost/api/expenses/exp-1/receipt', { method: 'POST', body: formData })

    const res = await POST(req, routeContext)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/expenses/[id]/receipt', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clears receipt for authorized user', async () => {
    vi.mocked(auth).mockResolvedValue(session as any)
    vi.mocked(prisma.expense.findUnique).mockResolvedValue({
      id: 'exp-1',
      householdId: 'hh-1',
      payerId: 'u1',
    } as any)
    vi.mocked(clearReceipt).mockResolvedValue({ id: 'exp-1', receiptUrl: null } as any)

    const res = await DELETE(new Request('http://localhost/api/expenses/exp-1/receipt', { method: 'DELETE' }), routeContext)

    expect(res.status).toBe(204)
    expect(clearReceipt).toHaveBeenCalledWith('exp-1')
  })
})
