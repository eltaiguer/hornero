import { describe, it, expect } from 'vitest'
import { updateSalarySchema, inviteMemberSchema } from '../member'

describe('updateSalarySchema', () => {
  it('should accept valid salary', () => {
    const result = updateSalarySchema.safeParse({ salary: 5000 })
    expect(result.success).toBe(true)
  })

  it('should accept zero salary', () => {
    const result = updateSalarySchema.safeParse({ salary: 0 })
    expect(result.success).toBe(true)
  })

  it('should accept null salary (to clear it)', () => {
    const result = updateSalarySchema.safeParse({ salary: null })
    expect(result.success).toBe(true)
  })

  it('should reject negative salary', () => {
    const result = updateSalarySchema.safeParse({ salary: -100 })
    expect(result.success).toBe(false)
  })

  it('should reject non-numeric salary', () => {
    const result = updateSalarySchema.safeParse({ salary: 'abc' })
    expect(result.success).toBe(false)
  })

  it('should accept optional effectiveFrom date', () => {
    const result = updateSalarySchema.safeParse({
      salary: 4500,
      effectiveFrom: '2026-04-01',
    })
    expect(result.success).toBe(true)
  })

  it('should reject invalid effectiveFrom date', () => {
    const result = updateSalarySchema.safeParse({
      salary: 4500,
      effectiveFrom: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('inviteMemberSchema', () => {
  it('should accept valid email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const result = inviteMemberSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('should reject empty email', () => {
    const result = inviteMemberSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
  })
})
