import { describe, expect, it } from 'vitest'
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFilterSchema,
} from '../expense'

describe('createExpenseSchema', () => {
  it('accepts valid equal split payload', () => {
    const result = createExpenseSchema.safeParse({
      amount: 120.25,
      description: 'Groceries',
      date: '2026-03-01T00:00:00.000Z',
      categoryId: 'cat-1',
      splitMethod: 'equal',
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-positive amounts', () => {
    const result = createExpenseSchema.safeParse({
      amount: 0,
      description: 'Invalid',
      date: '2026-03-01T00:00:00.000Z',
      categoryId: 'cat-1',
      splitMethod: 'equal',
    })

    expect(result.success).toBe(false)
  })

  it('requires valid custom split config JSON object', () => {
    const result = createExpenseSchema.safeParse({
      amount: 100,
      description: 'Custom split',
      date: '2026-03-01T00:00:00.000Z',
      categoryId: 'cat-1',
      splitMethod: 'custom',
      splitConfig: '{"user-1": 60, "user-2": 40}',
    })

    expect(result.success).toBe(true)
  })

  it('rejects malformed split config for custom split', () => {
    const result = createExpenseSchema.safeParse({
      amount: 100,
      description: 'Bad custom split',
      date: '2026-03-01T00:00:00.000Z',
      categoryId: 'cat-1',
      splitMethod: 'custom',
      splitConfig: '{"user-1": "oops"}',
    })

    expect(result.success).toBe(false)
  })
})

describe('updateExpenseSchema', () => {
  it('accepts partial updates', () => {
    const result = updateExpenseSchema.safeParse({ description: 'Updated' })
    expect(result.success).toBe(true)
  })
})

describe('expenseFilterSchema', () => {
  it('accepts empty filters', () => {
    const result = expenseFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts bounded amount range', () => {
    const result = expenseFilterSchema.safeParse({ minAmount: 10, maxAmount: 100 })
    expect(result.success).toBe(true)
  })

  it('rejects invalid amount range', () => {
    const result = expenseFilterSchema.safeParse({ minAmount: 100, maxAmount: 10 })
    expect(result.success).toBe(false)
  })
})
