import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createInvite, acceptInvite, getInviteByToken } from '../invite.service'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    householdInvite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    householdMember: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(prisma)),
  },
}))

describe('InviteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createInvite', () => {
    it('should create an invite with 7-day expiry', async () => {
      const mockInvite = {
        id: 'inv-1',
        householdId: 'hh-1',
        email: 'invitee@example.com',
        token: 'some-token',
        status: 'pending',
        invitedById: 'user-1',
        expiresAt: new Date(),
      }
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null) // user doesn't exist yet
      vi.mocked(prisma.householdInvite.create).mockResolvedValue(mockInvite as any)

      const result = await createInvite('hh-1', 'invitee@example.com', 'user-1')
      expect(result.email).toBe('invitee@example.com')
      expect(prisma.householdInvite.create).toHaveBeenCalled()

      const createCall = vi.mocked(prisma.householdInvite.create).mock.calls[0][0]
      const expiresAt = createCall.data.expiresAt as Date
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
      const diff = expiresAt.getTime() - Date.now()
      expect(diff).toBeGreaterThan(sevenDaysMs - 60000)
      expect(diff).toBeLessThanOrEqual(sevenDaysMs + 1000)
    })

    it('should reject invite if email is already a member', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing-user' } as any)
      vi.mocked(prisma.householdMember.findUnique).mockResolvedValue({ id: 'm-existing' } as any)

      await expect(
        createInvite('hh-1', 'existing@example.com', 'user-1')
      ).rejects.toThrow('already a member')
    })
  })

  describe('getInviteByToken', () => {
    it('should return invite when token is valid', async () => {
      const mockInvite = {
        id: 'inv-1',
        token: 'valid-token',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
        household: { id: 'hh-1', name: 'Family' },
      }
      vi.mocked(prisma.householdInvite.findUnique).mockResolvedValue(mockInvite as any)

      const result = await getInviteByToken('valid-token')
      expect(result).toBeDefined()
      expect(result?.status).toBe('pending')
    })

    it('should return null for nonexistent token', async () => {
      vi.mocked(prisma.householdInvite.findUnique).mockResolvedValue(null)

      const result = await getInviteByToken('bad-token')
      expect(result).toBeNull()
    })
  })

  describe('acceptInvite', () => {
    it('should mark invite as accepted and create membership', async () => {
      const mockInvite = {
        id: 'inv-1',
        householdId: 'hh-1',
        email: 'new@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 86400000),
      }
      vi.mocked(prisma.householdInvite.findUnique).mockResolvedValue(mockInvite as any)

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          householdInvite: {
            update: vi.fn().mockResolvedValue({ ...mockInvite, status: 'accepted' }),
          },
          householdMember: {
            create: vi.fn().mockResolvedValue({
              householdId: 'hh-1',
              userId: 'user-new',
              role: 'member',
            }),
          },
        }
        return fn(tx)
      })

      await acceptInvite('inv-1', 'user-new')
      expect(prisma.$transaction).toHaveBeenCalled()
    })

    it('should reject expired invite', async () => {
      const expiredInvite = {
        id: 'inv-1',
        householdId: 'hh-1',
        status: 'pending',
        expiresAt: new Date(Date.now() - 86400000),
      }
      vi.mocked(prisma.householdInvite.findUnique).mockResolvedValue(expiredInvite as any)

      await expect(acceptInvite('inv-1', 'user-new')).rejects.toThrow('expired')
    })

    it('should reject already-accepted invite', async () => {
      const acceptedInvite = {
        id: 'inv-1',
        status: 'accepted',
        expiresAt: new Date(Date.now() + 86400000),
      }
      vi.mocked(prisma.householdInvite.findUnique).mockResolvedValue(acceptedInvite as any)

      await expect(acceptInvite('inv-1', 'user-new')).rejects.toThrow('already')
    })
  })
})
