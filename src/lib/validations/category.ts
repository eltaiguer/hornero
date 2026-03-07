import { z } from 'zod'

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Color must be a valid hex value')
    .default('#6B7280'),
  emoji: z.string().min(1, 'Emoji is required').max(10, 'Emoji too long').default('📁'),
})

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().regex(HEX_COLOR_REGEX).optional(),
    emoji: z.string().min(1).max(10).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
