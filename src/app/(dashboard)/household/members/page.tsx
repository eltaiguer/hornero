import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getHouseholdById } from '@/services/household.service'
import { isHouseholdOwner, updateMemberSalary } from '@/services/member.service'
import { createInvite } from '@/services/invite.service'
import { SalaryInput } from '@/components/member/salary-input'
import { InviteMemberForm } from '@/components/household/invite-member-form'

interface Props {
  searchParams: Promise<{ id?: string }>
}

export default async function MembersPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/signin')
  }

  const { id } = await searchParams
  if (!id) {
    redirect('/dashboard')
  }

  const household = await getHouseholdById(id)
  if (!household) {
    notFound()
  }

  const isMember = household.members.some((m) => m.userId === session.user.id)
  if (!isMember) {
    redirect('/dashboard')
  }

  const isOwner = await isHouseholdOwner(id, session.user.id)

  async function handleSalaryUpdate(salary: number | null) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await updateMemberSalary(id!, s.user.id, salary)
  }

  async function handleInvite(email: string) {
    'use server'
    const s = await auth()
    if (!s?.user?.id) throw new Error('Unauthorized')
    await createInvite(id!, email, s.user.id)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">{household.name}</h1>
      <p className="text-sm text-gray-500">Currency: {household.currency}</p>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-3 space-y-3">
          {household.members.map((member) => (
            <li key={member.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.user.name ?? member.user.email}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
              {member.userId === session.user.id && (
                <div className="mt-3">
                  <SalaryInput
                    currentSalary={member.salary}
                    onSave={handleSalaryUpdate}
                    currency={household.currency}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Invite a member</h2>
          <div className="mt-3">
            <InviteMemberForm onInvite={handleInvite} />
          </div>
        </section>
      )}
    </main>
  )
}
