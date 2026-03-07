import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getMemberRole } from '@/services/member.service'
import { getSpendingTrend } from '@/services/insights.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) return jsonResponse({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) return jsonResponse({ error: 'Forbidden' }, { status: 403 })

  const search = new URL(request.url).searchParams
  const months = Number(search.get('months') ?? 6)

  const data = await getSpendingTrend(id, months)
  return jsonResponse(data)
}
