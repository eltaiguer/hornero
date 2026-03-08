import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { prisma } from '@/lib/prisma'
import { deleteCategory, updateCategory } from '@/services/category.service'
import { isHouseholdOwner } from '@/services/member.service'

type RouteContext = { params: Promise<{ id: string; categoryId: string }> }

async function ensureCategoryBelongsToHousehold(householdId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, householdId },
    select: { id: true },
  })

  return Boolean(category)
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, categoryId } = await params
  const owner = await isHouseholdOwner(id, session.user.id)
  if (!owner) {
    return jsonResponse({ error: 'Only the owner can manage categories' }, { status: 403 })
  }

  const inHousehold = await ensureCategoryBelongsToHousehold(id, categoryId)
  if (!inHousehold) {
    return jsonResponse({ error: 'Category not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const category = await updateCategory(categoryId, body)
    return jsonResponse(category)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, categoryId } = await params
  const owner = await isHouseholdOwner(id, session.user.id)
  if (!owner) {
    return jsonResponse({ error: 'Only the owner can manage categories' }, { status: 403 })
  }

  const inHousehold = await ensureCategoryBelongsToHousehold(id, categoryId)
  if (!inHousehold) {
    return jsonResponse({ error: 'Category not found' }, { status: 404 })
  }

  try {
    await deleteCategory(categoryId)
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
