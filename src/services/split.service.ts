import type { CreateExpenseInput } from '@/lib/validations/expense'

type SplitMethod = CreateExpenseInput['splitMethod']

export interface SplitMember {
  userId: string
  salary: number | null
}

export interface CalculatedSplit {
  userId: string
  amountOwed: number
}

function roundToCents(value: number): number {
  return Math.round(value * 100) / 100
}

function sumCents(values: number[]): number {
  return values.reduce((sum, value) => sum + Math.round(value * 100), 0)
}

function distributeByWeights(
  amount: number,
  members: SplitMember[],
  weights: number[]
): CalculatedSplit[] {
  const rawShares = members.map((_, index) => amount * (weights[index] / weights.reduce((s, w) => s + w, 0)))
  const roundedShares = rawShares.map(roundToCents)

  const totalCents = Math.round(amount * 100)
  const roundedTotalCents = sumCents(roundedShares)
  let remainingCents = totalCents - roundedTotalCents

  const indexesByPriority = Array.from(rawShares.keys()).sort((a, b) => rawShares[b] - rawShares[a])

  for (const index of indexesByPriority) {
    if (remainingCents === 0) {
      break
    }
    const adjustment = remainingCents > 0 ? 0.01 : -0.01
    roundedShares[index] = roundToCents(roundedShares[index] + adjustment)
    remainingCents += remainingCents > 0 ? -1 : 1
  }

  return members.map((member, index) => ({
    userId: member.userId,
    amountOwed: roundToCents(roundedShares[index]),
  }))
}

function parseCustomConfig(splitConfig?: string): Record<string, number> {
  if (!splitConfig) {
    throw new Error('splitConfig is required for custom split')
  }

  const parsed = JSON.parse(splitConfig)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('splitConfig must be a JSON object')
  }

  return parsed
}

export function calculateSplits(
  amount: number,
  splitMethod: SplitMethod,
  members: SplitMember[],
  splitConfig?: string
): CalculatedSplit[] {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }

  if (members.length === 0) {
    throw new Error('At least one member is required')
  }

  if (members.length === 1) {
    return [{ userId: members[0].userId, amountOwed: roundToCents(amount) }]
  }

  if (splitMethod === 'equal') {
    return distributeByWeights(amount, members, members.map(() => 1))
  }

  if (splitMethod === 'proportional') {
    const salaries = members.map((member) => (member.salary && member.salary > 0 ? member.salary : 0))
    const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0)

    if (totalSalary <= 0) {
      return distributeByWeights(amount, members, members.map(() => 1))
    }

    return distributeByWeights(amount, members, salaries)
  }

  const custom = parseCustomConfig(splitConfig)
  const percentages = members.map((member) => {
    const value = custom[member.userId]
    if (typeof value !== 'number' || value <= 0) {
      throw new Error('Custom split must provide positive percentages for all members')
    }
    return value
  })

  const percentageTotal = percentages.reduce((sum, value) => sum + value, 0)
  if (roundToCents(percentageTotal) !== 100) {
    throw new Error('Custom split percentages must sum to 100')
  }

  return distributeByWeights(amount, members, percentages)
}
