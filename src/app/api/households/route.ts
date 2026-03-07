import { auth } from '@/lib/auth'
import { createHousehold } from '@/services/household.service'
import { jsonResponse } from '@/lib/api-utils'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const household = await createHousehold(body, session.user.id)
    return jsonResponse(household, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
