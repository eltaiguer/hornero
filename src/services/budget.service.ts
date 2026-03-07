import { prisma } from '@/lib/prisma'
import { createBudgetSchema, type CreateBudgetInput } from '@/lib/validations/budget'

export interface BudgetProgressItem {
  categoryId: string
  categoryName: string
  budgetAmount: number
  actualSpent: number
  percentage: number
}

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

function roundToCents(value: number) {
  return Math.round(value * 100) / 100
}

export async function setBudget(householdId: string, input: CreateBudgetInput) {
  const validated = createBudgetSchema.parse(input)

  const category = await prisma.category.findFirst({
    where: { id: validated.categoryId, householdId },
    select: { id: true },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  return prisma.budget.upsert({
    where: {
      householdId_categoryId_month_year: {
        householdId,
        categoryId: validated.categoryId,
        month: validated.month,
        year: validated.year,
      },
    },
    update: { amount: validated.amount },
    create: {
      householdId,
      categoryId: validated.categoryId,
      month: validated.month,
      year: validated.year,
      amount: validated.amount,
    },
    include: {
      category: true,
    },
  })
}

export async function getBudgets(householdId: string, month: number, year: number) {
  return prisma.budget.findMany({
    where: { householdId, month, year },
    include: { category: true },
    orderBy: { category: { name: 'asc' } },
  })
}

export async function getBudgetProgress(
  householdId: string,
  month: number,
  year: number
): Promise<BudgetProgressItem[]> {
  const budgets = await getBudgets(householdId, month, year)
  const { start, end } = getMonthRange(month, year)

  const spendByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      householdId,
      date: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      amount: true,
    },
  })

  const spendMap = new Map(spendByCategory.map((row) => [row.categoryId, row._sum.amount ?? 0]))

  return budgets.map((budget) => {
    const actualSpent = roundToCents(spendMap.get(budget.categoryId) ?? 0)
    const percentage = budget.amount > 0 ? roundToCents((actualSpent / budget.amount) * 100) : 0

    return {
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      budgetAmount: budget.amount,
      actualSpent,
      percentage,
    }
  })
}

export async function checkBudgetAlerts(householdId: string, month: number, year: number) {
  const progress = await getBudgetProgress(householdId, month, year)

  return progress
    .filter((item) => item.percentage >= 80)
    .map((item) => ({
      ...item,
      level: item.percentage >= 100 ? ('danger' as const) : ('warning' as const),
    }))
}

export async function deleteBudget(budgetId: string) {
  await prisma.budget.delete({ where: { id: budgetId } })
}
