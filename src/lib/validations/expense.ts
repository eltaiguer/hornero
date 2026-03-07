import { z } from 'zod'
import { SPLIT_METHODS } from './household'

const splitMethodSchema = z.enum(SPLIT_METHODS)

function isValidCustomSplitConfig(value: string): boolean {
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return false
    }

    const entries = Object.entries(parsed)
    if (!entries.length) {
      return false
    }

    return entries.every(([key, percent]) => {
      return typeof key === 'string' && key.length > 0 && typeof percent === 'number' && percent > 0
    })
  } catch {
    return false
  }
}

const baseExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(200, 'Description too long'),
  date: z.coerce.date(),
  categoryId: z.string().min(1, 'Category is required'),
  splitMethod: splitMethodSchema,
  splitConfig: z.string().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
})

export const createExpenseSchema = baseExpenseSchema.superRefine((value, ctx) => {
  if (value.splitMethod === 'custom') {
    if (!value.splitConfig || !isValidCustomSplitConfig(value.splitConfig)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'splitConfig must be a valid JSON map of userId to percentage',
        path: ['splitConfig'],
      })
    }
  }
})

export const updateExpenseSchema = baseExpenseSchema
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required',
      })
      return
    }

    if (value.splitMethod === 'custom' && value.splitConfig) {
      if (!isValidCustomSplitConfig(value.splitConfig)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'splitConfig must be a valid JSON map of userId to percentage',
          path: ['splitConfig'],
        })
      }
    }
  })

export const expenseFilterSchema = z
  .object({
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    categoryId: z.string().optional(),
    payerId: z.string().optional(),
    minAmount: z.number().nonnegative().optional(),
    maxAmount: z.number().nonnegative().optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(20),
  })
  .superRefine((value, ctx) => {
    if (value.minAmount !== undefined && value.maxAmount !== undefined && value.minAmount > value.maxAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minAmount cannot exceed maxAmount',
        path: ['minAmount'],
      })
    }

    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom cannot be after dateTo',
        path: ['dateFrom'],
      })
    }
  })

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>
