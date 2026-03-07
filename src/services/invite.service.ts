import { prisma } from '@/lib/prisma'
import { inviteMemberSchema } from '@/lib/validations/member'

const INVITE_EXPIRY_DAYS = 7

export async function createInvite(
  householdId: string,
  email: string,
  invitedById: string
) {
  inviteMemberSchema.parse({ email })

  // Check if already a member (by looking up user by email, then checking membership)
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    const existingMember = await prisma.householdMember.findUnique({
      where: {
        householdId_userId: { householdId, userId: existingUser.id },
      },
    })
    if (existingMember) {
      throw new Error('This person is already a member of the household')
    }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS)

  return prisma.householdInvite.create({
    data: {
      householdId,
      email,
      invitedById,
      expiresAt,
    },
  })
}

export async function getInviteByToken(token: string) {
  return prisma.householdInvite.findUnique({
    where: { token },
    include: {
      household: { select: { id: true, name: true } },
    },
  })
}

export async function getPendingInvitesByEmail(email: string) {
  return prisma.householdInvite.findMany({
    where: {
      email,
      status: 'pending',
      expiresAt: { gte: new Date() },
    },
    include: {
      household: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function acceptInvite(inviteId: string, userId: string) {
  const invite = await prisma.householdInvite.findUnique({
    where: { id: inviteId },
  })

  if (!invite) {
    throw new Error('Invite not found')
  }

  if (invite.status !== 'pending') {
    throw new Error('This invite has already been used')
  }

  if (invite.expiresAt < new Date()) {
    throw new Error('This invite has expired')
  }

  return prisma.$transaction(async (tx) => {
    await tx.householdInvite.update({
      where: { id: inviteId },
      data: { status: 'accepted' },
    })

    return tx.householdMember.create({
      data: {
        householdId: invite.householdId,
        userId,
        role: 'member',
      },
    })
  })
}

export async function acceptInviteByToken(token: string, userId: string, userEmail: string) {
  const invite = await getInviteByToken(token)
  if (!invite) {
    throw new Error('Invite not found')
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new Error('This invite is for a different email')
  }

  return acceptInvite(invite.id, userId)
}
