import { prisma } from '@/lib/prisma'

function getMonthRange(month: number, year: number) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

function getPreviousMonth(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export async function getMonthlySummary(householdId: string, month: number, year: number) {
  const currentRange = getMonthRange(month, year)
  const prev = getPreviousMonth(month, year)
  const prevRange = getMonthRange(prev.month, prev.year)

  const [currentSpend, prevSpend, budgetTotal] = await Promise.all([
    prisma.expense.aggregate({
      where: { householdId, date: { gte: currentRange.start, lte: currentRange.end } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { householdId, date: { gte: prevRange.start, lte: prevRange.end } },
      _sum: { amount: true },
    }),
    prisma.budget.aggregate({
      where: { householdId, month, year },
      _sum: { amount: true },
    }),
  ])

  const totalSpent = currentSpend._sum.amount ?? 0
  const previous = prevSpend._sum.amount ?? 0
  const budget = budgetTotal._sum.amount ?? 0

  const vsLastMonthPct = previous > 0 ? round(((totalSpent - previous) / previous) * 100) : 0
  const vsBudgetPct = budget > 0 ? round((totalSpent / budget) * 100) : 0

  return { totalSpent, vsLastMonthPct, vsBudgetPct }
}

export async function getSpendingByCategory(householdId: string, month: number, year: number) {
  const { start, end } = getMonthRange(month, year)

  const grouped = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { householdId, date: { gte: start, lte: end } },
    _sum: { amount: true },
  })

  const categoryIds = grouped.map((row) => row.categoryId)
  const categories = categoryIds.length
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, color: true, emoji: true },
      })
    : []
  const categoryMap = new Map(categories.map((category) => [category.id, category]))

  const all = grouped.map((row) => ({
    categoryId: row.categoryId,
    category: categoryMap.get(row.categoryId)?.name ?? 'Unknown',
    color: categoryMap.get(row.categoryId)?.color ?? '#6b7280',
    emoji: categoryMap.get(row.categoryId)?.emoji ?? '📁',
    amount: round(row._sum.amount ?? 0),
  }))

  const totalAmount = all.reduce((sum, item) => sum + item.amount, 0)

  return all.map((item) => ({
    ...item,
    percentage: totalAmount > 0 ? round((item.amount / totalAmount) * 100) : 0,
  }))
}

export async function getSpendingTrend(householdId: string, months: number) {
  const end = new Date()
  const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0))

  const grouped = await prisma.expense.groupBy({
    by: ['date'],
    where: { householdId, date: { gte: start, lte: end } },
    _sum: { amount: true },
    orderBy: { date: 'asc' },
  })

  const byMonth = new Map<string, number>()
  for (const row of grouped) {
    const key = `${row.date.getUTCFullYear()}-${String(row.date.getUTCMonth() + 1).padStart(2, '0')}`
    byMonth.set(key, (byMonth.get(key) ?? 0) + (row._sum.amount ?? 0))
  }

  return Array.from(byMonth.entries()).map(([monthKey, total]) => ({
    month: monthKey,
    total: round(total),
  }))
}

export async function getMemberBreakdown(householdId: string, month: number, year: number) {
  const { start, end } = getMonthRange(month, year)

  const expenses = await prisma.expense.findMany({
    where: { householdId, date: { gte: start, lte: end } },
    select: {
      splits: {
        select: {
          userId: true,
          amountOwed: true,
        },
      },
    },
  })

  const totals = new Map<string, number>()
  for (const expense of expenses) {
    for (const split of expense.splits) {
      totals.set(split.userId, (totals.get(split.userId) ?? 0) + split.amountOwed)
    }
  }

  const users = prisma.user
    ? await prisma.user.findMany({
        where: { id: { in: Array.from(totals.keys()) } },
        select: { id: true, name: true, email: true },
      })
    : []
  const userMap = new Map(users.map((user) => [user.id, user]))

  return Array.from(totals.entries()).map(([userId, amount]) => ({
    userId,
    name: userMap.get(userId)?.name ?? userMap.get(userId)?.email ?? 'Unknown',
    amount: round(amount),
  }))
}

export async function getTopExpenses(
  householdId: string,
  month: number,
  year: number,
  limit: number
) {
  const { start, end } = getMonthRange(month, year)

  return prisma.expense.findMany({
    where: { householdId, date: { gte: start, lte: end } },
    include: {
      category: { select: { name: true, emoji: true } },
      payer: { select: { id: true, name: true, email: true } },
    },
    orderBy: { amount: 'desc' },
    take: limit,
  })
}

export async function getBudgetVsActual(householdId: string, month: number, year: number) {
  const budgets = await prisma.budget.findMany({
    where: { householdId, month, year },
    include: { category: { select: { name: true, color: true, emoji: true } } },
  })

  const byCategory = await getSpendingByCategory(householdId, month, year)
  const actualMap = new Map(byCategory.map((item) => [item.categoryId, item.amount]))

  return budgets.map((budget) => ({
    categoryId: budget.categoryId,
    category: budget.category.name,
    color: budget.category.color,
    emoji: budget.category.emoji,
    budget: round(budget.amount),
    actual: round(actualMap.get(budget.categoryId) ?? 0),
  }))
}
