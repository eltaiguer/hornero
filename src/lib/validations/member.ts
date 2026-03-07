import { z } from 'zod'

export const updateSalarySchema = z.object({
  salary: z.number().min(0, 'Salary cannot be negative').nullable(),
})

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type UpdateSalaryInput = z.infer<typeof updateSalarySchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
