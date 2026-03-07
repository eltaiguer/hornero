import { describe, expect, it } from 'vitest'
import { createBudgetSchema, updateBudgetSchema } from '../budget'

describe('createBudgetSchema', () => {
  it('accepts valid input', () => {
    const result = createBudgetSchema.safeParse({
      categoryId: 'cat-1',
      month: 3,
      year: 2026,
      amount: 500,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid month', () => {
    const result = createBudgetSchema.safeParse({
      categoryId: 'cat-1',
      month: 13,
      year: 2026,
      amount: 500,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-positive amount', () => {
    const result = createBudgetSchema.safeParse({
      categoryId: 'cat-1',
      month: 3,
      year: 2026,
      amount: 0,
    })

    expect(result.success).toBe(false)
  })
})

describe('updateBudgetSchema', () => {
  it('accepts amount-only update', () => {
    const result = updateBudgetSchema.safeParse({ amount: 250 })
    expect(result.success).toBe(true)
  })
})
