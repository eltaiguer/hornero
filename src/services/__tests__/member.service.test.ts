import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  updateMemberSalary,
  getMemberRole,
  isHouseholdOwner,
  getHouseholdMembers,
} from '../member.service'
import { prisma } from '@/lib/prisma'
import * as splitService from '../split.service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    householdMember: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    memberSalaryHistory: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
    expenseSplit: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(async (fn: any) => fn(prisma)),
  },
}))

describe('MemberService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateMemberSalary', () => {
    it('should upsert salary history and recompute proportional splits from effective date', async () => {
      const mockMember = { id: 'm-1', salary: 5000 }
      vi.mocked(prisma.householdMember.update).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.householdMember.findUniqueOrThrow).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.memberSalaryHistory.upsert).mockResolvedValue({ id: 'h-1' } as any)
      vi.mocked(prisma.expense.findMany).mockResolvedValue([
        { id: 'exp-1', amount: 120, date: new Date('2026-03-20T00:00:00.000Z'), splitConfig: null },
      ] as any)
      vi.mocked(prisma.householdMember.findMany)
        .mockResolvedValueOnce([
          { userId: 'user-1', salary: 5000 },
          { userId: 'user-2', salary: 2000 },
        ] as any)
        .mockResolvedValueOnce([
          { userId: 'user-1', salary: 5000 },
          { userId: 'user-2', salary: 2000 },
        ] as any)
      vi.mocked(prisma.memberSalaryHistory.findMany).mockResolvedValue([
        {
          householdId: 'hh-1',
          userId: 'user-1',
          salary: 5000,
          effectiveFrom: new Date('2026-03-01T00:00:00.000Z'),
        },
      ] as any)
      vi.spyOn(splitService, 'calculateSplits').mockReturnValue([
        { userId: 'user-1', amountOwed: 60 },
        { userId: 'user-2', amountOwed: 60 },
      ])
      vi.mocked(prisma.expenseSplit.deleteMany).mockResolvedValue({ count: 2 } as any)
      vi.mocked(prisma.expenseSplit.createMany).mockResolvedValue({ count: 2 } as any)

      const effectiveFrom = new Date('2026-03-01T00:00:00.000Z')
      const result = await updateMemberSalary('hh-1', 'user-1', 5000, effectiveFrom)
      expect(result.salary).toBe(5000)
      expect(prisma.memberSalaryHistory.upsert).toHaveBeenCalledWith({
        where: {
          householdId_userId_effectiveFrom: {
            householdId: 'hh-1',
            userId: 'user-1',
            effectiveFrom,
          },
        },
        update: { salary: 5000 },
        create: {
          householdId: 'hh-1',
          userId: 'user-1',
          salary: 5000,
          effectiveFrom,
        },
      })
      expect(prisma.expenseSplit.deleteMany).toHaveBeenCalledWith({ where: { expenseId: 'exp-1' } })
    })

    it('should allow clearing salary with null', async () => {
      const mockMember = { id: 'm-1', salary: null }
      vi.mocked(prisma.householdMember.update).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.householdMember.findUniqueOrThrow).mockResolvedValue(mockMember as any)
      vi.mocked(prisma.memberSalaryHistory.upsert).mockResolvedValue({ id: 'h-1' } as any)
      vi.mocked(prisma.expense.findMany).mockResolvedValue([] as any)

      const result = await updateMemberSalary('hh-1', 'user-1', null)
      expect(result.salary).toBeNull()
    })

    it('should reject negative salary', async () => {
      await expect(
        updateMemberSalary('hh-1', 'user-1', -100)
      ).rejects.toThrow()
    })
  })

  describe('getMemberRole', () => {
    it('should return role when member exists', async () => {
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue({
        role: 'owner',
      } as any)

      const role = await getMemberRole('hh-1', 'user-1')
      expect(role).toBe('owner')
    })

    it('should return null when not a member', async () => {
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue(null)

      const role = await getMemberRole('hh-1', 'user-x')
      expect(role).toBeNull()
    })
  })

  describe('isHouseholdOwner', () => {
    it('should return true for owner', async () => {
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue({
        role: 'owner',
      } as any)

      expect(await isHouseholdOwner('hh-1', 'user-1')).toBe(true)
    })

    it('should return false for member', async () => {
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue({
        role: 'member',
      } as any)

      expect(await isHouseholdOwner('hh-1', 'user-2')).toBe(false)
    })

    it('should return false for non-member', async () => {
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue(null)

      expect(await isHouseholdOwner('hh-1', 'user-x')).toBe(false)
    })
  })

  describe('getHouseholdMembers', () => {
    it('should return members with user details', async () => {
      const mockMembers = [
        { id: 'm-1', userId: 'u-1', role: 'owner', salary: 5000, user: { name: 'Owner' } },
        { id: 'm-2', userId: 'u-2', role: 'member', salary: 3000, user: { name: 'Member' } },
      ]
      vi.mocked(prisma.householdMember.findMany).mockResolvedValue(mockMembers as any)

      const result = await getHouseholdMembers('hh-1')
      expect(result).toHaveLength(2)
      expect(prisma.householdMember.findMany).toHaveBeenCalledWith({
        where: { householdId: 'hh-1' },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      })
    })
  })
})
