import { auth } from '@/lib/auth'
import { getMemberRole } from '@/services/member.service'
import { exportExpensesCsv } from '@/services/export.service'
import { jsonResponse } from '@/lib/api-utils'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  const search = new URL(request.url).searchParams
  const from = search.get('from')
  const to = search.get('to')

  if (!from || !to) {
    return jsonResponse({ error: 'from and to are required' }, { status: 400 })
  }

  const csv = await exportExpensesCsv(id, new Date(from), new Date(to))
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="expenses.csv"',
    },
  })
}
