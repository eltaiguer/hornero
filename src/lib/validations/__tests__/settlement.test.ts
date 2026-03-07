import { describe, expect, it } from 'vitest'
import { createSettlementSchema } from '../settlement'

describe('createSettlementSchema', () => {
  it('accepts valid settlement payload', () => {
    const result = createSettlementSchema.safeParse({
      receiverId: 'user-2',
      amount: 45.5,
      note: 'Dinner settle up',
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-positive amount', () => {
    const result = createSettlementSchema.safeParse({
      receiverId: 'user-2',
      amount: 0,
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty receiverId', () => {
    const result = createSettlementSchema.safeParse({
      receiverId: '',
      amount: 10,
    })

    expect(result.success).toBe(false)
  })
})
