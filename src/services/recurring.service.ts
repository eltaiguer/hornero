import { prisma } from '@/lib/prisma'
import {
  createRecurringExpenseSchema,
  isValidRecurringCustomSplitConfig,
  type CreateRecurringExpenseInput,
  type RecurringFrequency,
  updateRecurringExpenseSchema,
  type UpdateRecurringExpenseInput,
} from '@/lib/validations/recurring'
import { calculateSplits } from './split.service'
import { getMembersWithEffectiveSalary } from './member.service'
import { notifyBudgetThresholds } from './push.service'

type ProcessResult = { createdCount: number; skippedCount: number }
type RecurringItems = Awaited<ReturnType<typeof prisma.recurringExpense.findMany>>

export function advanceNextDueDate(current: Date, frequency: RecurringFrequency): Date {
  const next = new Date(current)

  if (frequency === 'daily') {
    next.setUTCDate(next.getUTCDate() + 1)
    return next
  }

  if (frequency === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7)
    return next
  }

  if (frequency === 'monthly') {
    next.setUTCMonth(next.getUTCMonth() + 1)
    return next
  }

  next.setUTCFullYear(next.getUTCFullYear() + 1)
  return next
}

export async function createRecurringExpense(
  householdId: string,
  payerId: string,
  input: CreateRecurringExpenseInput
) {
  const validated = createRecurringExpenseSchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: validated.categoryId, householdId },
    select: { id: true },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  return prisma.recurringExpense.create({
    data: {
      householdId,
      payerId,
      amount: validated.amount,
      description: validated.description,
      categoryId: validated.categoryId,
      splitMethod: validated.splitMethod,
      splitConfig: validated.splitConfig,
      frequency: validated.frequency,
      nextDueDate: validated.startDate,
      endDate: validated.endDate,
      active: true,
    },
  })
}

export async function updateRecurringExpense(recurringId: string, input: UpdateRecurringExpenseInput) {
  const validated = updateRecurringExpenseSchema.parse(input)
  const existing = await prisma.recurringExpense.findUnique({
    where: { id: recurringId },
    select: { splitMethod: true, splitConfig: true },
  })

  if (!existing) {
    throw new Error('Recurring expense not found')
  }

  const data: Record<string, unknown> = {
    ...validated,
  }

  const nextSplitMethod = validated.splitMethod ?? (existing.splitMethod as CreateRecurringExpenseInput['splitMethod'])
  const nextSplitConfig = validated.splitConfig ?? existing.splitConfig ?? undefined
  const splitFieldsChanged = validated.splitMethod !== undefined || validated.splitConfig !== undefined
  if (splitFieldsChanged && nextSplitMethod === 'custom' && (!nextSplitConfig || !isValidRecurringCustomSplitConfig(nextSplitConfig))) {
    throw new Error('Custom recurring splitConfig must be a valid percentage map that sums to 100')
  }

  if (nextSplitMethod !== 'custom' && validated.splitMethod) {
    data.splitConfig = null
  }

  if (validated.startDate) {
    data.nextDueDate = validated.startDate
    delete data.startDate
  }

  return prisma.recurringExpense.update({
    where: { id: recurringId },
    data,
  })
}

export async function pauseRecurringExpense(recurringId: string) {
  return prisma.recurringExpense.update({
    where: { id: recurringId },
    data: { active: false },
  })
}

export async function resumeRecurringExpense(recurringId: string) {
  return prisma.recurringExpense.update({
    where: { id: recurringId },
    data: { active: true },
  })
}

export async function deleteRecurringExpense(recurringId: string) {
  await prisma.recurringExpense.delete({ where: { id: recurringId } })
}

export async function getRecurringExpenses(householdId: string) {
  return prisma.recurringExpense.findMany({
    where: { householdId },
    include: {
      payer: { select: { id: true, name: true, email: true } },
      category: true,
    },
    orderBy: [{ active: 'desc' }, { nextDueDate: 'asc' }],
  })
}

async function materializeRecurringItems(recurring: RecurringItems): Promise<ProcessResult> {
  let createdCount = 0
  let skippedCount = 0

  for (const item of recurring) {
    try {
      const members = await getMembersWithEffectiveSalary(item.householdId, item.nextDueDate)

      const splits = calculateSplits(
        item.amount,
        item.splitMethod as CreateRecurringExpenseInput['splitMethod'],
        members,
        item.splitConfig ?? undefined
      )

      await prisma.$transaction(async (tx) => {
        const expense = await tx.expense.create({
          data: {
            householdId: item.householdId,
            payerId: item.payerId,
            amount: item.amount,
            description: item.description,
            date: item.nextDueDate,
            categoryId: item.categoryId,
            splitMethod: item.splitMethod,
            splitConfig: item.splitConfig,
          },
        })

        await tx.expenseSplit.createMany({
          data: splits.map((split) => ({
            expenseId: expense.id,
            userId: split.userId,
            amountOwed: split.amountOwed,
          })),
        })
      })

      const nextDueDate = advanceNextDueDate(item.nextDueDate, item.frequency as RecurringFrequency)
      const shouldDeactivate = Boolean(item.endDate && nextDueDate > item.endDate)

      await prisma.recurringExpense.update({
        where: { id: item.id },
        data: {
          nextDueDate,
          active: shouldDeactivate ? false : item.active,
        },
      })

      try {
        await notifyBudgetThresholds(
          item.householdId,
          item.nextDueDate.getUTCMonth() + 1,
          item.nextDueDate.getUTCFullYear()
        )
      } catch {
        // Budget notification failures must not block recurring materialization.
      }

      createdCount += 1
    } catch (error) {
      skippedCount += 1
      console.error(`[recurring] failed to materialize ${item.id}`, error)
    }
  }

  return { createdCount, skippedCount }
}

export async function processDueExpenses(now = new Date()): Promise<ProcessResult> {
  const recurring = await prisma.recurringExpense.findMany({
    where: {
      active: true,
      nextDueDate: { lte: now },
    },
  })

  return materializeRecurringItems(recurring)
}

export async function ensureDueExpensesForHousehold(
  householdId: string,
  now = new Date()
): Promise<ProcessResult> {
  const recurring = await prisma.recurringExpense.findMany({
    where: {
      householdId,
      active: true,
      nextDueDate: { lte: now },
    },
  })

  return materializeRecurringItems(recurring)
}
