import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { createCategory, getCategories } from '@/services/category.service'
import { getMemberRole, isHouseholdOwner } from '@/services/member.service'

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

  const categories = await getCategories(id)
  return jsonResponse(categories)
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const owner = await isHouseholdOwner(id, session.user.id)
  if (!owner) {
    return jsonResponse({ error: 'Only the owner can manage categories' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const category = await createCategory(id, body)
    return jsonResponse(category, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
