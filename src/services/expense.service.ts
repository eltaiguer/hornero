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

function getDateToInclusive(date: Date) {
  const inclusive = new Date(date)
  inclusive.setHours(23, 59, 59, 999)
  return inclusive
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

  return prisma.$transaction(async (tx) => {
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
}

export async function getExpenses(householdId: string, filters: Partial<ExpenseFilterInput>) {
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

  const skip = (validated.page - 1) * validated.pageSize

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        payer: { select: { id: true, name: true, email: true } },
        category: true,
        splits: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: validated.pageSize,
    }),
    prisma.expense.count({ where }),
  ])

  return {
    items,
    total,
    page: validated.page,
    pageSize: validated.pageSize,
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
