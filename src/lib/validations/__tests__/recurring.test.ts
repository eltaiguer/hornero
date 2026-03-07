import { describe, expect, it } from 'vitest'
import { createRecurringExpenseSchema, updateRecurringExpenseSchema } from '../recurring'

describe('createRecurringExpenseSchema', () => {
  it('accepts valid recurring input', () => {
    const result = createRecurringExpenseSchema.safeParse({
      amount: 100,
      description: 'Rent',
      categoryId: 'cat-1',
      splitMethod: 'equal',
      frequency: 'monthly',
      startDate: '2026-03-01T00:00:00.000Z',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid frequency', () => {
    const result = createRecurringExpenseSchema.safeParse({
      amount: 100,
      description: 'Rent',
      categoryId: 'cat-1',
      splitMethod: 'equal',
      frequency: 'hourly',
      startDate: '2026-03-01T00:00:00.000Z',
    })

    expect(result.success).toBe(false)
  })
})

describe('updateRecurringExpenseSchema', () => {
  it('accepts partial updates including active flag', () => {
    const result = updateRecurringExpenseSchema.safeParse({
      active: false,
      amount: 120,
    })

    expect(result.success).toBe(true)
  })
})
