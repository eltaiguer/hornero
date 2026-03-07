import { auth } from '@/lib/auth'
import { jsonResponse } from '@/lib/api-utils'
import { uploadReceipt } from '@/services/receipt.service'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth()
  if (!session?.user?.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const maybeFile = formData.get('file')

  if (!maybeFile || typeof (maybeFile as Blob).arrayBuffer !== 'function') {
    return jsonResponse({ error: 'file is required' }, { status: 400 })
  }

  try {
    const { id } = await params
    const updated = await uploadReceipt(id, maybeFile as Blob & { name?: string })
    return jsonResponse(updated)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return jsonResponse({ error: message }, { status: 400 })
  }
}
