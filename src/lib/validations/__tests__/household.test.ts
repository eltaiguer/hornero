import { describe, it, expect } from 'vitest'
import {
  createHouseholdSchema,
  updateHouseholdSettingsSchema,
  SPLIT_METHODS,
} from '../household'

describe('createHouseholdSchema', () => {
  it('should accept valid household data', () => {
    const result = createHouseholdSchema.safeParse({
      name: 'My Family',
      currency: 'USD',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = createHouseholdSchema.safeParse({
      name: '',
      currency: 'USD',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name longer than 100 characters', () => {
    const result = createHouseholdSchema.safeParse({
      name: 'A'.repeat(101),
      currency: 'USD',
    })
    expect(result.success).toBe(false)
  })

  it('should default currency to USD when not provided', () => {
    const result = createHouseholdSchema.safeParse({ name: 'Home' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.currency).toBe('USD')
    }
  })

  it('should reject unsupported currency', () => {
    const result = createHouseholdSchema.safeParse({
      name: 'Home',
      currency: 'XYZ',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateHouseholdSettingsSchema', () => {
  it('should accept valid settings update', () => {
    const result = updateHouseholdSettingsSchema.safeParse({
      name: 'Updated Name',
      currency: 'EUR',
      defaultSplitMethod: 'proportional',
    })
    expect(result.success).toBe(true)
  })

  it('should accept partial update (name only)', () => {
    const result = updateHouseholdSettingsSchema.safeParse({
      name: 'New Name',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid split method', () => {
    const result = updateHouseholdSettingsSchema.safeParse({
      defaultSplitMethod: 'random',
    })
    expect(result.success).toBe(false)
  })

  it('should accept all valid split methods', () => {
    for (const method of SPLIT_METHODS) {
      const result = updateHouseholdSettingsSchema.safeParse({
        defaultSplitMethod: method,
      })
      expect(result.success).toBe(true)
    }
  })
})
