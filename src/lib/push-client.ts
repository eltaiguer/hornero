import { createRequire } from 'module'

export interface PushSubscriptionPayload {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushSendResult {
  ok: boolean
  stale: boolean
}

interface WebPushClient {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void
  sendNotification: (subscription: PushSubscriptionPayload, payload: string) => Promise<unknown>
}

let cachedClient: WebPushClient | null | undefined
let vapidConfigured = false
const requireModule = createRequire(import.meta.url)

function hasPushEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_SUBJECT
  )
}

async function loadWebPushClient(): Promise<WebPushClient | null> {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  try {
    const imported = requireModule('web-push') as Partial<WebPushClient> & { default?: Partial<WebPushClient> }
    const candidate = (imported.default ?? imported) as Partial<WebPushClient>

    if (
      typeof candidate.setVapidDetails !== 'function' ||
      typeof candidate.sendNotification !== 'function'
    ) {
      cachedClient = null
      return null
    }

    cachedClient = candidate as WebPushClient
    return cachedClient
  } catch {
    cachedClient = null
    return null
  }
}

async function getConfiguredClient(): Promise<WebPushClient | null> {
  if (!hasPushEnv()) {
    return null
  }

  const client = await loadWebPushClient()
  if (!client) {
    return null
  }

  if (!vapidConfigured) {
    client.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )
    vapidConfigured = true
  }

  return client
}

function getStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  if ('statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode
    return typeof statusCode === 'number' ? statusCode : undefined
  }

  return undefined
}

export async function sendPushNotification(
  subscription: PushSubscriptionPayload,
  payload: unknown
): Promise<PushSendResult> {
  const client = await getConfiguredClient()
  if (!client) {
    return { ok: false, stale: false }
  }

  try {
    await client.sendNotification(subscription, JSON.stringify(payload))
    return { ok: true, stale: false }
  } catch (error) {
    const statusCode = getStatusCode(error)
    const stale = statusCode === 404 || statusCode === 410
    return { ok: false, stale }
  }
}
