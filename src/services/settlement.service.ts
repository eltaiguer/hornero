import { prisma } from '@/lib/prisma'
import { createSettlementSchema, type CreateSettlementInput } from '@/lib/validations/settlement'

export async function createSettlement(
  householdId: string,
  payerId: string,
  input: CreateSettlementInput
) {
  const validated = createSettlementSchema.parse(input)

  if (validated.receiverId === payerId) {
    throw new Error('Receiver must be different from payer')
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true },
  })

  const memberIds = new Set(members.map((member) => member.userId))

  if (!memberIds.has(payerId)) {
    throw new Error('Payer must be a household member')
  }

  if (!memberIds.has(validated.receiverId)) {
    throw new Error('Receiver must be a household member')
  }

  return prisma.settlement.create({
    data: {
      householdId,
      payerId,
      receiverId: validated.receiverId,
      amount: validated.amount,
      note: validated.note,
    },
    include: {
      payer: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getSettlements(householdId: string) {
  return prisma.settlement.findMany({
    where: { householdId },
    include: {
      payer: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: 'desc' },
  })
}
