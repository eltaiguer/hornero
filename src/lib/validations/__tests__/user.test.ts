import { describe, it, expect } from 'vitest'
import { updateProfileSchema } from '../user'

describe('updateProfileSchema', () => {
  it('should accept valid profile data', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jose Garcia',
      image: 'https://example.com/avatar.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('should accept name-only update', () => {
    const result = updateProfileSchema.safeParse({ name: 'Jose' })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = updateProfileSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('should reject invalid image URL', () => {
    const result = updateProfileSchema.safeParse({
      name: 'Jose',
      image: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })
})
