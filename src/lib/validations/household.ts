import { z } from 'zod'

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'ARS', 'BRL', 'MXN', 'CLP', 'COP',
  'JPY', 'CAD', 'AUD', 'CHF', 'UYU',
] as const

export const SPLIT_METHODS = ['equal', 'proportional', 'custom'] as const

export const createHouseholdSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
})

export const updateHouseholdSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  defaultSplitMethod: z.enum(SPLIT_METHODS).optional(),
})

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>
export type UpdateHouseholdSettingsInput = z.infer<typeof updateHouseholdSettingsSchema>
