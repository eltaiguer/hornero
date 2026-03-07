import { z } from 'zod'
import { SPLIT_METHODS } from './household'

export const RECURRING_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const

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

export const createRecurringExpenseSchema = recurringBaseSchema

export const updateRecurringExpenseSchema = recurringBaseSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
  })

export type CreateRecurringExpenseInput = z.infer<typeof createRecurringExpenseSchema>
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number]
