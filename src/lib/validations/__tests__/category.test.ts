import { describe, expect, it } from 'vitest'
import { createCategorySchema, updateCategorySchema } from '../category'

describe('createCategorySchema', () => {
  it('accepts valid category input', () => {
    const result = createCategorySchema.safeParse({
      name: 'Groceries',
      color: '#22C55E',
      emoji: '🛒',
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hex color', () => {
    const result = createCategorySchema.safeParse({ name: 'Food', color: 'green' })
    expect(result.success).toBe(false)
  })

  it('defaults color and emoji', () => {
    const result = createCategorySchema.parse({ name: 'Transport' })
    expect(result.color).toBe('#6B7280')
    expect(result.emoji).toBe('📁')
  })
})

describe('updateCategorySchema', () => {
  it('accepts partial updates', () => {
    const result = updateCategorySchema.safeParse({ color: '#111827' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid emoji length', () => {
    const result = updateCategorySchema.safeParse({ emoji: '' })
    expect(result.success).toBe(false)
  })
})
