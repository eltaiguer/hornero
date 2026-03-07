import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  getTestPrisma,
  resetTestDatabase,
  disconnectTestDatabase,
} from '../helpers/prisma'

describe('Database Schema M2', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    await resetTestDatabase()
    prisma = getTestPrisma()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await (prisma as any).expenseSplit.deleteMany()
    await (prisma as any).expense.deleteMany()
    await (prisma as any).category.deleteMany()
    await prisma.householdInvite.deleteMany()
    await prisma.householdMember.deleteMany()
    await prisma.household.deleteMany()
    await prisma.user.deleteMany()
  })

  it('enforces unique category name per household', async () => {
    const owner = await prisma.user.create({ data: { email: 'cat-owner@test.com', name: 'Owner' } })
    const household = await prisma.household.create({
      data: {
        name: 'Category HH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: owner.id,
      },
    })

    await (prisma as any).category.create({
      data: {
        householdId: household.id,
        name: 'Food',
        color: '#22C55E',
        emoji: '🍔',
      },
    })

    await expect(
      (prisma as any).category.create({
        data: {
          householdId: household.id,
          name: 'Food',
          color: '#EF4444',
          emoji: '🍽️',
        },
      })
    ).rejects.toThrow()
  })

  it('cascades categories, expenses, and splits when household is deleted', async () => {
    const owner = await prisma.user.create({ data: { email: 'cascade-owner@test.com', name: 'Owner' } })
    const member = await prisma.user.create({ data: { email: 'cascade-member@test.com', name: 'Member' } })

    const household = await prisma.household.create({
      data: {
        name: 'Cascade HH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: owner.id,
      },
    })

    await prisma.householdMember.createMany({
      data: [
        { householdId: household.id, userId: owner.id, role: 'owner' },
        { householdId: household.id, userId: member.id, role: 'member' },
      ],
    })

    const category = await (prisma as any).category.create({
      data: {
        householdId: household.id,
        name: 'Groceries',
        color: '#22C55E',
        emoji: '🛒',
      },
    })

    const expense = await (prisma as any).expense.create({
      data: {
        householdId: household.id,
        payerId: owner.id,
        amount: 120,
        description: 'Weekly groceries',
        date: new Date('2026-03-01T10:00:00.000Z'),
        categoryId: category.id,
        splitMethod: 'equal',
      },
    })

    await (prisma as any).expenseSplit.createMany({
      data: [
        { expenseId: expense.id, userId: owner.id, amountOwed: 60 },
        { expenseId: expense.id, userId: member.id, amountOwed: 60 },
      ],
    })

    await prisma.household.delete({ where: { id: household.id } })

    const categories = await (prisma as any).category.findMany({ where: { householdId: household.id } })
    const expenses = await (prisma as any).expense.findMany({ where: { householdId: household.id } })
    const splits = await (prisma as any).expenseSplit.findMany({ where: { expenseId: expense.id } })

    expect(categories).toHaveLength(0)
    expect(expenses).toHaveLength(0)
    expect(splits).toHaveLength(0)
  })

  it('enforces unique user split per expense', async () => {
    const owner = await prisma.user.create({ data: { email: 'split-owner@test.com', name: 'Owner' } })

    const household = await prisma.household.create({
      data: {
        name: 'Split HH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: owner.id,
      },
    })

    await prisma.householdMember.create({
      data: { householdId: household.id, userId: owner.id, role: 'owner' },
    })

    const category = await (prisma as any).category.create({
      data: {
        householdId: household.id,
        name: 'Utilities',
        color: '#3B82F6',
        emoji: '💡',
      },
    })

    const expense = await (prisma as any).expense.create({
      data: {
        householdId: household.id,
        payerId: owner.id,
        amount: 80,
        description: 'Electric bill',
        date: new Date('2026-03-03T08:00:00.000Z'),
        categoryId: category.id,
        splitMethod: 'equal',
      },
    })

    await (prisma as any).expenseSplit.create({
      data: {
        expenseId: expense.id,
        userId: owner.id,
        amountOwed: 80,
      },
    })

    await expect(
      (prisma as any).expenseSplit.create({
        data: {
          expenseId: expense.id,
          userId: owner.id,
          amountOwed: 80,
        },
      })
    ).rejects.toThrow()
  })
})
