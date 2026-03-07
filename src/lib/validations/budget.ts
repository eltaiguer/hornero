import { z } from 'zod'

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(3000),
  amount: z.number().positive('Amount must be greater than 0'),
})

export const updateBudgetSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
})

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
