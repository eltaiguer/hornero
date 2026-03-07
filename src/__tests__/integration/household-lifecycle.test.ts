import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  getTestPrisma,
  resetTestDatabase,
  disconnectTestDatabase,
} from '../helpers/prisma'

// We test the services against a real database, but we need to override
// the prisma import used by services. We mock the lib/prisma module to return
// our test prisma instance.
let prisma: PrismaClient

import { vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  get prisma() {
    return prisma
  },
}))

// Import services AFTER mocking prisma
const { createHousehold, getHouseholdById, getUserHouseholds, updateHouseholdSettings } = await import(
  '@/services/household.service'
)
const { updateMemberSalary, isHouseholdOwner, getHouseholdMembers } = await import(
  '@/services/member.service'
)
const { createInvite, getInviteByToken, acceptInvite } = await import(
  '@/services/invite.service'
)

describe('Household Lifecycle (Integration)', () => {
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
    await prisma.user.deleteMany()
  })

  it('should create a household with the creator as owner', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', name: 'Owner' },
    })

    const household = await createHousehold(
      { name: 'Test Family', currency: 'USD' },
      user.id
    )

    expect(household.name).toBe('Test Family')
    expect(household.currency).toBe('USD')

    const isOwner = await isHouseholdOwner(household.id, user.id)
    expect(isOwner).toBe(true)
  })

  it('should retrieve household with members', async () => {
    const user = await prisma.user.create({
      data: { email: 'get@test.com', name: 'GetUser' },
    })
    const household = await createHousehold(
      { name: 'Retrieve HH', currency: 'EUR' },
      user.id
    )

    const fetched = await getHouseholdById(household.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.name).toBe('Retrieve HH')
    expect(fetched!.members).toHaveLength(1)
    expect(fetched!.members[0].user.email).toBe('get@test.com')
  })

  it('should list households for a user', async () => {
    const user = await prisma.user.create({
      data: { email: 'list@test.com', name: 'ListUser' },
    })
    await createHousehold({ name: 'HH 1', currency: 'USD' }, user.id)
    await createHousehold({ name: 'HH 2', currency: 'EUR' }, user.id)

    const households = await getUserHouseholds(user.id)
    expect(households).toHaveLength(2)
    expect(households.map((h) => h.name).sort()).toEqual(['HH 1', 'HH 2'])
  })

  it('should update household settings', async () => {
    const user = await prisma.user.create({
      data: { email: 'settings@test.com', name: 'Settings' },
    })
    const household = await createHousehold(
      { name: 'Old Name', currency: 'USD' },
      user.id
    )

    const updated = await updateHouseholdSettings(household.id, {
      name: 'New Name',
    })
    expect(updated.name).toBe('New Name')
  })

  it('should update member salary', async () => {
    const user = await prisma.user.create({
      data: { email: 'salary@test.com', name: 'SalaryUser' },
    })
    const household = await createHousehold(
      { name: 'Salary HH', currency: 'USD' },
      user.id
    )

    const updated = await updateMemberSalary(household.id, user.id, 5000)
    expect(updated.salary).toBe(5000)
  })

  it('should complete the full invite + accept flow', async () => {
    // Owner creates household
    const owner = await prisma.user.create({
      data: { email: 'invite-owner@test.com', name: 'InvOwner' },
    })
    const household = await createHousehold(
      { name: 'Invite HH', currency: 'USD' },
      owner.id
    )

    // Owner sends invite
    const invite = await createInvite(
      household.id,
      'invitee@test.com',
      owner.id
    )
    expect(invite.status).toBe('pending')
    expect(invite.token).toBeDefined()

    // Verify invite can be looked up by token
    const found = await getInviteByToken(invite.token)
    expect(found).not.toBeNull()
    expect(found!.household.name).toBe('Invite HH')

    // Invitee creates account and accepts invite
    const invitee = await prisma.user.create({
      data: { email: 'invitee@test.com', name: 'Invitee' },
    })
    const membership = await acceptInvite(invite.id, invitee.id)
    expect(membership.role).toBe('member')
    expect(membership.householdId).toBe(household.id)

    // Verify household now has 2 members
    const members = await getHouseholdMembers(household.id)
    expect(members).toHaveLength(2)

    // Invitee is not the owner
    const inviteeIsOwner = await isHouseholdOwner(household.id, invitee.id)
    expect(inviteeIsOwner).toBe(false)
  })

  it('should prevent inviting an existing member', async () => {
    const user = await prisma.user.create({
      data: { email: 'dup-invite@test.com', name: 'DupInvite' },
    })
    const household = await createHousehold(
      { name: 'Dup Invite HH', currency: 'USD' },
      user.id
    )

    await expect(
      createInvite(household.id, 'dup-invite@test.com', user.id)
    ).rejects.toThrow('already a member')
  })

  it('should prevent accepting an expired invite', async () => {
    const owner = await prisma.user.create({
      data: { email: 'expire-owner@test.com', name: 'ExpOwner' },
    })
    const household = await createHousehold(
      { name: 'Expire HH', currency: 'USD' },
      owner.id
    )

    // Create invite directly with expired date
    const invite = await prisma.householdInvite.create({
      data: {
        householdId: household.id,
        email: 'expired@test.com',
        invitedById: owner.id,
        expiresAt: new Date(Date.now() - 86400000), // yesterday
      },
    })

    const invitee = await prisma.user.create({
      data: { email: 'expired@test.com', name: 'Expired' },
    })

    await expect(acceptInvite(invite.id, invitee.id)).rejects.toThrow(
      'expired'
    )
  })
})
