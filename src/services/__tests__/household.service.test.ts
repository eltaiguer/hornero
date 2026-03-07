import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHousehold, getHouseholdById, updateHouseholdSettings } from '../household.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    household: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    householdMember: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn({
      household: { create: vi.fn() },
      householdMember: { create: vi.fn() },
    })),
  },
}))

describe('HouseholdService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createHousehold', () => {
    it('should create a household and add creator as owner', async () => {
      const mockHousehold = {
        id: 'hh-1',
        name: 'My Family',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: 'user-1',
      }

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          household: {
            create: vi.fn().mockResolvedValue(mockHousehold),
          },
          householdMember: {
            create: vi.fn().mockResolvedValue({ id: 'member-1' }),
          },
        }
        return fn(tx)
      })

      const result = await createHousehold(
        { name: 'My Family', currency: 'USD' },
        'user-1'
      )

      expect(result.name).toBe('My Family')
      expect(prisma.$transaction).toHaveBeenCalledOnce()
    })

    it('should throw if name is empty', async () => {
      await expect(
        createHousehold({ name: '', currency: 'USD' }, 'user-1')
      ).rejects.toThrow()
    })
  })

  describe('getHouseholdById', () => {
    it('should return household with members when found', async () => {
      const mockHousehold = {
        id: 'hh-1',
        name: 'Family',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: 'user-1',
        members: [
          { id: 'm-1', userId: 'user-1', role: 'owner', user: { name: 'Owner', email: 'o@e.com' } },
        ],
      }
      vi.mocked(prisma.household.findUnique).mockResolvedValue(mockHousehold as any)

      const result = await getHouseholdById('hh-1')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Family')
    })

    it('should return null when household not found', async () => {
      vi.mocked(prisma.household.findUnique).mockResolvedValue(null)

      const result = await getHouseholdById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('updateHouseholdSettings', () => {
    it('should update household name', async () => {
      const updated = { id: 'hh-1', name: 'New Name', currency: 'USD', defaultSplitMethod: 'equal' }
      vi.mocked(prisma.household.update).mockResolvedValue(updated as any)

      const result = await updateHouseholdSettings('hh-1', { name: 'New Name' })
      expect(result.name).toBe('New Name')
      expect(prisma.household.update).toHaveBeenCalledWith({
        where: { id: 'hh-1' },
        data: { name: 'New Name' },
      })
    })

    it('should update currency and split method together', async () => {
      const updated = { id: 'hh-1', name: 'Home', currency: 'EUR', defaultSplitMethod: 'proportional' }
      vi.mocked(prisma.household.update).mockResolvedValue(updated as any)

      const result = await updateHouseholdSettings('hh-1', {
        currency: 'EUR',
        defaultSplitMethod: 'proportional',
      })
      expect(result.currency).toBe('EUR')
      expect(result.defaultSplitMethod).toBe('proportional')
    })
  })
})
