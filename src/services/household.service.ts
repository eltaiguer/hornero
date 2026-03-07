import { prisma } from '@/lib/prisma'
import {
  createHouseholdSchema,
  updateHouseholdSettingsSchema,
  type CreateHouseholdInput,
  type UpdateHouseholdSettingsInput,
} from '@/lib/validations/household'
import { DEFAULT_CATEGORIES } from './category.service'

export async function createHousehold(input: CreateHouseholdInput, userId: string) {
  const validated = createHouseholdSchema.parse(input)

  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({
      data: {
        name: validated.name,
        currency: validated.currency,
        defaultSplitMethod: 'equal',
        createdById: userId,
      },
    })

    await tx.householdMember.create({
      data: {
        householdId: household.id,
        userId,
        role: 'owner',
      },
    })

    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        householdId: household.id,
        name: category.name,
        color: category.color,
        emoji: category.emoji,
        isDefault: true,
      })),
    })

    return household
  })
}

export async function getUserHouseholds(userId: string) {
  const memberships = await prisma.householdMember.findMany({
    where: { userId },
    include: { household: true },
  })
  return memberships.map((m) => m.household)
}

export async function getHouseholdById(id: string) {
  return prisma.household.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  })
}

export async function updateHouseholdSettings(
  householdId: string,
  input: UpdateHouseholdSettingsInput
) {
  const validated = updateHouseholdSettingsSchema.parse(input)

  return prisma.household.update({
    where: { id: householdId },
    data: validated,
  })
}
