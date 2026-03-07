import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { calculateBalances, getSimplifiedDebts } from '@/services/balance.service'
import { getMemberRole } from '@/services/member.service'

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

  const balances = await calculateBalances(id)
  const simplifiedDebts = getSimplifiedDebts(balances)
  return jsonResponse({ balances, simplifiedDebts })
}
