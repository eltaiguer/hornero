import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  getTestPrisma,
  resetTestDatabase,
  disconnectTestDatabase,
} from '../helpers/prisma'

describe('Database Schema', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    await resetTestDatabase()
    prisma = getTestPrisma()
  })

  afterAll(async () => {
    await disconnectTestDatabase()
  })

  beforeEach(async () => {
    await prisma.householdInvite.deleteMany()
    await prisma.householdMember.deleteMany()
    await prisma.household.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()
  })

  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' },
    })
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
  })

  it('should create a household with a creator', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@example.com', name: 'Owner' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'Test Household',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    expect(household.id).toBeDefined()
    expect(household.name).toBe('Test Household')
    expect(household.createdById).toBe(user.id)
  })

  it('should create a household member linking user and household', async () => {
    const user = await prisma.user.create({
      data: { email: 'member@example.com', name: 'Member' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'Household',
        currency: 'EUR',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    const member = await prisma.householdMember.create({
      data: {
        householdId: household.id,
        userId: user.id,
        role: 'owner',
        salary: 5000.0,
      },
    })
    expect(member.householdId).toBe(household.id)
    expect(member.userId).toBe(user.id)
    expect(member.role).toBe('owner')
    expect(member.salary).toBe(5000.0)
  })

  it('should enforce unique email on users', async () => {
    await prisma.user.create({
      data: { email: 'unique@example.com', name: 'First' },
    })
    await expect(
      prisma.user.create({
        data: { email: 'unique@example.com', name: 'Second' },
      })
    ).rejects.toThrow()
  })

  it('should enforce unique user per household', async () => {
    const user = await prisma.user.create({
      data: { email: 'dup@example.com', name: 'Dup' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'HH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: user.id, role: 'owner' },
    })
    await expect(
      prisma.householdMember.create({
        data: { householdId: household.id, userId: user.id, role: 'member' },
      })
    ).rejects.toThrow()
  })

  it('should cascade delete household members when household is deleted', async () => {
    const user = await prisma.user.create({
      data: { email: 'cascade@example.com', name: 'Cascade' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'CascadeHH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    await prisma.householdMember.create({
      data: { householdId: household.id, userId: user.id, role: 'owner' },
    })
    await prisma.household.delete({ where: { id: household.id } })
    const members = await prisma.householdMember.findMany({
      where: { householdId: household.id },
    })
    expect(members).toHaveLength(0)
  })

  it('should create a household invite', async () => {
    const user = await prisma.user.create({
      data: { email: 'inviter@example.com', name: 'Inviter' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'InviteHH',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    const invite = await prisma.householdInvite.create({
      data: {
        householdId: household.id,
        email: 'invitee@example.com',
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    expect(invite.id).toBeDefined()
    expect(invite.token).toBeDefined()
    expect(invite.status).toBe('pending')
    expect(invite.email).toBe('invitee@example.com')
  })

  it('should cascade delete invites when household is deleted', async () => {
    const user = await prisma.user.create({
      data: { email: 'inv-cascade@example.com', name: 'Owner' },
    })
    const household = await prisma.household.create({
      data: {
        name: 'InvCascade',
        currency: 'USD',
        defaultSplitMethod: 'equal',
        createdById: user.id,
      },
    })
    await prisma.householdInvite.create({
      data: {
        householdId: household.id,
        email: 'someone@example.com',
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 86400000),
      },
    })
    await prisma.household.delete({ where: { id: household.id } })
    const invites = await prisma.householdInvite.findMany({
      where: { householdId: household.id },
    })
    expect(invites).toHaveLength(0)
  })
})
