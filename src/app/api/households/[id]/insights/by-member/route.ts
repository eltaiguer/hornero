import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getMemberRole } from '@/services/member.service'
import { getMemberBreakdown } from '@/services/insights.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) return jsonResponse({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) return jsonResponse({ error: 'Forbidden' }, { status: 403 })

  const search = new URL(request.url).searchParams
  const month = Number(search.get('month'))
  const year = Number(search.get('year'))

  const data = await getMemberBreakdown(id, month, year)
  return jsonResponse(data)
}
