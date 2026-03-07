import { auth } from '@/lib/auth'
import { getHouseholdById, updateHouseholdSettings } from '@/services/household.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'
import { jsonResponse } from '@/lib/api-utils'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  const household = await getHouseholdById(id)
  return jsonResponse(household)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const isOwner = await isHouseholdOwner(id, session.user.id)
  if (!isOwner) {
    return jsonResponse({ error: 'Only the owner can update settings' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const household = await updateHouseholdSettings(id, body)
    return jsonResponse(household)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
