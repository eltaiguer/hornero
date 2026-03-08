import { prisma } from '@/lib/prisma'
import { updateSalarySchema } from '@/lib/validations/member'
import { calculateSplits, type SplitMember } from './split.service'

type PrismaLike = typeof prisma

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

async function getMembersWithEffectiveSalaryUsing(
  db: PrismaLike,
  householdId: string,
  atDate: Date
): Promise<SplitMember[]> {
  const members = await db.householdMember.findMany({
    where: { householdId },
    select: { userId: true, salary: true },
  })

  const history = await db.memberSalaryHistory.findMany({
    where: {
      householdId,
      effectiveFrom: { lte: atDate },
    },
    orderBy: [{ effectiveFrom: 'desc' }, { createdAt: 'desc' }],
  })

  const byUser = new Map<string, number | null>()
  for (const row of history) {
    if (!byUser.has(row.userId)) {
      byUser.set(row.userId, row.salary)
    }
  }

  return members.map((member) => ({
    userId: member.userId,
    salary: byUser.has(member.userId) ? byUser.get(member.userId)! : member.salary,
  }))
}

export async function getMembersWithEffectiveSalary(
  householdId: string,
  atDate: Date
): Promise<SplitMember[]> {
  return getMembersWithEffectiveSalaryUsing(prisma, householdId, atDate)
}

async function recomputeProportionalSplitsFromDateUsing(
  db: PrismaLike,
  householdId: string,
  effectiveFrom: Date
) {
  const expenses = await db.expense.findMany({
    where: {
      householdId,
      splitMethod: 'proportional',
      date: { gte: effectiveFrom },
    },
    select: {
      id: true,
      amount: true,
      date: true,
      splitConfig: true,
    },
  })

  for (const expense of expenses) {
    const members = await getMembersWithEffectiveSalaryUsing(db, householdId, expense.date)
    const splits = calculateSplits(expense.amount, 'proportional', members, expense.splitConfig ?? undefined)

    await db.expenseSplit.deleteMany({ where: { expenseId: expense.id } })
    await db.expenseSplit.createMany({
      data: splits.map((split) => ({
        expenseId: expense.id,
        userId: split.userId,
        amountOwed: split.amountOwed,
      })),
    })
  }
}

export async function updateMemberSalary(
  householdId: string,
  userId: string,
  salary: number | null,
  effectiveFromInput?: Date | string
) {
  const validated = updateSalarySchema.parse({
    salary,
    effectiveFrom: effectiveFromInput,
  })
  const effectiveFrom = validated.effectiveFrom ?? new Date()

  return prisma.$transaction(async (tx) => {
    await tx.memberSalaryHistory.upsert({
      where: {
        householdId_userId_effectiveFrom: {
          householdId,
          userId,
          effectiveFrom,
        },
      },
      update: { salary: validated.salary },
      create: {
        householdId,
        userId,
        salary: validated.salary,
        effectiveFrom,
      },
    })

    const todayKey = toIsoDate(new Date())
    const effectiveKey = toIsoDate(effectiveFrom)
    if (effectiveKey <= todayKey) {
      await tx.householdMember.update({
        where: {
          householdId_userId: { householdId, userId },
        },
        data: { salary: validated.salary },
      })
    }

    await recomputeProportionalSplitsFromDateUsing(tx as PrismaLike, householdId, effectiveFrom)

    return tx.householdMember.findUniqueOrThrow({
      where: {
        householdId_userId: { householdId, userId },
      },
    })
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

export async function getSalaryHistory(householdId: string, userId: string) {
  return prisma.memberSalaryHistory.findMany({
    where: { householdId, userId },
    orderBy: { effectiveFrom: 'desc' },
  })
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
