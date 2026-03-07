import { prisma } from '@/lib/prisma'
import { updateSalarySchema } from '@/lib/validations/member'

export async function updateMemberSalary(
  householdId: string,
  userId: string,
  salary: number | null
) {
  updateSalarySchema.parse({ salary })

  return prisma.householdMember.update({
    where: {
      householdId_userId: { householdId, userId },
    },
    data: { salary },
  })
}

export async function getMemberRole(
  householdId: string,
  userId: string
): Promise<string | null> {
  const member = await prisma.householdMember.findUnique({
    where: {
      householdId_userId: { householdId, userId },
    },
    select: { role: true },
  })
  return member?.role ?? null
}

export async function isHouseholdOwner(
  householdId: string,
  userId: string
): Promise<boolean> {
  const role = await getMemberRole(householdId, userId)
  return role === 'owner'
}

export async function getHouseholdMembers(householdId: string) {
  return prisma.householdMember.findMany({
    where: { householdId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  })
}
