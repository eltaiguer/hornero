import { describe, expect, it } from 'vitest'
import { calculateSplits } from '../split.service'

describe('calculateSplits', () => {
  it('splits equally for two members', () => {
    const result = calculateSplits(100, 'equal', [
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
    ])

    expect(result).toEqual([
      { userId: 'u1', amountOwed: 50 },
      { userId: 'u2', amountOwed: 50 },
    ])
  })

  it('splits equally with cent balancing for three members', () => {
    const result = calculateSplits(100, 'equal', [
      { userId: 'u1', salary: 1000 },
      { userId: 'u2', salary: 1000 },
      { userId: 'u3', salary: 1000 },
    ])

    const total = result.reduce((sum, item) => sum + item.amountOwed, 0)
    expect(total).toBe(100)
    expect(result).toHaveLength(3)
  })

  it('falls back to equal for proportional when salaries are missing', () => {
    const result = calculateSplits(90, 'proportional', [
      { userId: 'u1', salary: null },
      { userId: 'u2', salary: 0 },
      { userId: 'u3', salary: null },
    ])

    expect(result.map((r) => r.amountOwed)).toEqual([30, 30, 30])
  })

  it('splits proportionally with salary weights', () => {
    const result = calculateSplits(120, 'proportional', [
      { userId: 'u1', salary: 4000 },
      { userId: 'u2', salary: 2000 },
    ])

    expect(result).toEqual([
      { userId: 'u1', amountOwed: 80 },
      { userId: 'u2', amountOwed: 40 },
    ])
  })

  it('supports custom percentage splits', () => {
    const result = calculateSplits(
      100,
      'custom',
      [
        { userId: 'u1', salary: null },
        { userId: 'u2', salary: null },
      ],
      '{"u1": 60, "u2": 40}'
    )

    expect(result).toEqual([
      { userId: 'u1', amountOwed: 60 },
      { userId: 'u2', amountOwed: 40 },
    ])
  })

  it('throws for invalid custom percentages', () => {
    expect(() =>
      calculateSplits(
        100,
        'custom',
        [
          { userId: 'u1', salary: null },
          { userId: 'u2', salary: null },
        ],
        '{"u1": 70, "u2": 20}'
      )
    ).toThrow('Custom split percentages must sum to 100')
  })

  it('handles single member household', () => {
    const result = calculateSplits(45.5, 'equal', [{ userId: 'u1', salary: 1000 }])
    expect(result).toEqual([{ userId: 'u1', amountOwed: 45.5 }])
  })
})
