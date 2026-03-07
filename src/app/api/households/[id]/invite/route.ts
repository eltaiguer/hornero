import { auth } from '@/lib/auth'
import { isHouseholdOwner } from '@/services/member.service'
import { createInvite } from '@/services/invite.service'
import { jsonResponse } from '@/lib/api-utils'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const isOwner = await isHouseholdOwner(id, session.user.id)
  if (!isOwner) {
    return jsonResponse(
      { error: 'Only the household owner can send invites' },
      { status: 403 }
    )
  }

  try {
    const { email } = await request.json()
    const invite = await createInvite(id, email, session.user.id)
    return jsonResponse(invite, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
