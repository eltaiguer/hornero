import { prisma } from '@/lib/prisma'

function escapeCsv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export async function exportExpensesCsv(householdId: string, from: Date, to: Date) {
  const expenses = await prisma.expense.findMany({
    where: {
      householdId,
      date: {
        gte: from,
        lte: to,
      },
    },
    include: {
      category: { select: { name: true } },
      payer: { select: { name: true, email: true } },
    },
    orderBy: { date: 'asc' },
  })

  const header = 'date,description,amount,category,payer'
  const rows = expenses.map((expense) => {
    const payer = expense.payer.name ?? expense.payer.email ?? 'Unknown'
    return [
      expense.date.toISOString(),
      escapeCsv(expense.description),
      expense.amount.toFixed(2),
      escapeCsv(expense.category.name),
      escapeCsv(payer),
    ].join(',')
  })

  return [header, ...rows].join('\n') + '\n'
}
