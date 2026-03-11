import { prisma } from '@/lib/prisma'
import {
  createExpenseSchema,
  expenseFilterSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type ExpenseFilterInput,
  type UpdateExpenseInput,
} from '@/lib/validations/expense'
import { calculateSplits } from './split.service'
import { getMembersWithEffectiveSalary } from './member.service'
import { ensureDueExpensesForHousehold } from './recurring.service'
import { notifyBudgetThresholds } from './push.service'

const INLINE_RECURRING_SYNC_COOLDOWN_MS = 60_000
const inlineRecurringSyncAt = new Map<string, number>()

function getDateToInclusive(date: Date) {
  const inclusive = new Date(date)
  inclusive.setHours(23, 59, 59, 999)
  return inclusive
}

function shouldInlineSyncRecurring(householdId: string, now: number) {
  if (process.env.NODE_ENV === 'test') {
    return true
  }

  const previous = inlineRecurringSyncAt.get(householdId) ?? 0
  if (now - previous < INLINE_RECURRING_SYNC_COOLDOWN_MS) {
    return false
  }

  inlineRecurringSyncAt.set(householdId, now)
  return true
}

export async function createExpense(
  householdId: string,
  input: CreateExpenseInput,
  payerId: string
) {
  const validated = createExpenseSchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: validated.categoryId, householdId },
    select: { id: true },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  const members = await getMembersWithEffectiveSalary(householdId, validated.date)

  if (!members.some((member) => member.userId === payerId)) {
    throw new Error('Payer must be a household member')
  }

  const splits = calculateSplits(
    validated.amount,
    validated.splitMethod,
    members,
    validated.splitConfig
  )

  const expense = await prisma.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        householdId,
        payerId,
        amount: validated.amount,
        description: validated.description,
        date: validated.date,
        categoryId: validated.categoryId,
        splitMethod: validated.splitMethod,
        splitConfig: validated.splitConfig,
        notes: validated.notes,
      },
    })

    await tx.expenseSplit.createMany({
      data: splits.map((split) => ({
        expenseId: expense.id,
        userId: split.userId,
        amountOwed: split.amountOwed,
      })),
    })

    return expense
  })

  const month = validated.date.getUTCMonth() + 1
  const year = validated.date.getUTCFullYear()
  try {
    await notifyBudgetThresholds(householdId, month, year)
  } catch {
    // Notification dispatch failures should not fail expense creation.
  }

  return expense
}

export async function getExpenses(householdId: string, filters: Partial<ExpenseFilterInput>) {
  if (shouldInlineSyncRecurring(householdId, Date.now())) {
    if (process.env.NODE_ENV === 'test') {
      await ensureDueExpensesForHousehold(householdId, new Date())
    } else {
      void ensureDueExpensesForHousehold(householdId, new Date()).catch(() => {
        // Recurring materialization should not block expense reads.
      })
    }
  }

  const validated = expenseFilterSchema.parse(filters)
  const where: Record<string, unknown> = { householdId }

  if (validated.categoryId) {
    where.categoryId = validated.categoryId
  }

  if (validated.payerId) {
    where.payerId = validated.payerId
  }

  if (validated.minAmount !== undefined || validated.maxAmount !== undefined) {
    where.amount = {
      gte: validated.minAmount,
      lte: validated.maxAmount,
    }
  }

  if (validated.dateFrom || validated.dateTo) {
    where.date = {
      gte: validated.dateFrom,
      lte: validated.dateTo ? getDateToInclusive(validated.dateTo) : undefined,
    }
  }

  const baseQuery = {
    where,
    select: {
      id: true,
      description: true,
      amount: true,
      date: true,
      payer: { select: { id: true, name: true, email: true } },
      category: {
        select: { id: true, name: true, emoji: true, color: true },
      },
    },
    orderBy: [{ date: 'desc' as const }, { id: 'desc' as const }],
  }

  const listPromise = validated.cursor
      ? prisma.expense.findMany({
        ...baseQuery,
        cursor: { id: validated.cursor },
        skip: 1,
        take: validated.pageSize + 1,
      })
      : prisma.expense.findMany({
        ...baseQuery,
        skip: (validated.page - 1) * validated.pageSize,
        take: validated.pageSize,
      })
  const totalPromise = validated.cursor
    ? Promise.resolve<number | null>(null)
    : prisma.expense.count({ where })

  const [items, total] = await Promise.all([listPromise, totalPromise])

  const hasMore = validated.cursor ? items.length > validated.pageSize : false
  const normalizedItems = hasMore ? items.slice(0, validated.pageSize) : items
  const nextCursor = hasMore ? normalizedItems[normalizedItems.length - 1]?.id : null

  return {
    items: normalizedItems,
    total: total ?? normalizedItems.length,
    page: validated.page,
    pageSize: validated.pageSize,
    nextCursor,
  }
}

export async function getExpenseById(id: string) {
  return prisma.expense.findUnique({
    where: { id },
    include: {
      payer: { select: { id: true, name: true, email: true } },
      category: true,
      splits: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  })
}

export async function updateExpense(expenseId: string, input: UpdateExpenseInput) {
  const validated = updateExpenseSchema.parse(input)

  const current = await prisma.expense.findUnique({ where: { id: expenseId } })
  if (!current) {
    throw new Error('Expense not found')
  }

  const nextState = {
    amount: validated.amount ?? current.amount,
    description: validated.description ?? current.description,
    date: validated.date ?? current.date,
    categoryId: validated.categoryId ?? current.categoryId,
    splitMethod: validated.splitMethod ?? current.splitMethod,
    splitConfig: validated.splitConfig ?? current.splitConfig ?? undefined,
    notes: validated.notes ?? current.notes ?? undefined,
  }

  const members = await getMembersWithEffectiveSalary(current.householdId, nextState.date)

  const splits = calculateSplits(
    nextState.amount,
    nextState.splitMethod as CreateExpenseInput['splitMethod'],
    members,
    nextState.splitConfig ?? undefined
  )

  return prisma.$transaction(async (tx) => {
    const expense = await tx.expense.update({
      where: { id: expenseId },
      data: nextState,
    })

    await tx.expenseSplit.deleteMany({ where: { expenseId } })
    await tx.expenseSplit.createMany({
      data: splits.map((split) => ({
        expenseId,
        userId: split.userId,
        amountOwed: split.amountOwed,
      })),
    })

    return expense
  })
}

export async function deleteExpense(expenseId: string) {
  await prisma.expense.delete({ where: { id: expenseId } })
}
