import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  updateMemberSalary,
  getMemberRole,
  isHouseholdOwner,
  getHouseholdMembers,
} from '../member.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    householdMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}))

describe('MemberService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateMemberSalary', () => {
    it('should update salary for a member', async () => {
      const mockMember = { id: 'm-1', salary: 5000 }
      vi.mocked(prisma.householdMember.update).mockResolvedValue(mockMember as any)

      const result = await updateMemberSalary('hh-1', 'user-1', 5000)
      expect(result.salary).toBe(5000)
      expect(prisma.householdMember.update).toHaveBeenCalledWith({
        where: { householdId_userId: { householdId: 'hh-1', userId: 'user-1' } },
        data: { salary: 5000 },
      })
    })

    it('should allow clearing salary with null', async () => {
      const mockMember = { id: 'm-1', salary: null }
      vi.mocked(prisma.householdMember.update).mockResolvedValue(mockMember as any)

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
