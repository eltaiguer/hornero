import { z } from 'zod'
import { SPLIT_METHODS } from './household'

export const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

export function isValidRecurringCustomSplitConfig(value: string): boolean {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }

    const entries = Object.entries(parsed)
    if (!entries.length) {
      return false
    }

    let total = 0
    for (const [key, percentage] of entries) {
      if (typeof key !== 'string' || key.length === 0) {
        return false
      }
      if (typeof percentage !== 'number' || percentage <= 0) {
        return false
      }
      total += percentage
    }

    return Math.round(total * 100) / 100 === 100
  } catch {
    return false
  }
}

const recurringBaseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  splitMethod: z.enum(SPLIT_METHODS),
  splitConfig: z.string().optional(),
  frequency: z.enum(RECURRING_FREQUENCIES),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
})

export const createRecurringExpenseSchema = recurringBaseSchema.superRefine((value, ctx) => {
  if (value.splitMethod !== 'custom') {
    return
  }

  if (!value.splitConfig || !isValidRecurringCustomSplitConfig(value.splitConfig)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'splitConfig must be a valid JSON map of userId to percentage summing to 100',
      path: ['splitConfig'],
    })
  }
})

export const updateRecurringExpenseSchema = recurringBaseSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.splitMethod !== 'custom') {
      return
    }

    if (!value.splitConfig || !isValidRecurringCustomSplitConfig(value.splitConfig)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'splitConfig must be a valid JSON map of userId to percentage summing to 100',
        path: ['splitConfig'],
      })
    }
  })

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number]
