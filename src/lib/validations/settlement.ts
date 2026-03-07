import { z } from 'zod'

export const createSettlementSchema = z.object({
  receiverId: z.string().min(1, 'Receiver is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().max(500, 'Note too long').optional(),
})

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>
