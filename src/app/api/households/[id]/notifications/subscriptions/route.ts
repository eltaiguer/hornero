import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { getMemberRole } from '@/services/member.service'
import { registerPushSubscription, removePushSubscription } from '@/services/push.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const subscription = body?.subscription
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return jsonResponse({ error: 'Invalid subscription payload' }, { status: 400 })
    }

    const created = await registerPushSubscription(id, session.user.id, subscription)
    return jsonResponse(created, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const role = await getMemberRole(id, session.user.id)
  if (!role) {
    return jsonResponse({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    if (!body?.endpoint) {
      return jsonResponse({ error: 'endpoint is required' }, { status: 400 })
    }

    await removePushSubscription(id, session.user.id, body.endpoint)
    return new Response(null, { status: 204 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
