import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/services/receipt.service', () => ({ uploadReceipt: vi.fn() }))

import { auth } from '@/lib/auth'
import { uploadReceipt } from '@/services/receipt.service'
import { POST } from '../route'

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
})
