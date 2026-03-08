import { jsonResponse } from '@/lib/api-utils'
import { sendDailyPaymentReminders } from '@/services/push.service'

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await sendDailyPaymentReminders(new Date())
  return jsonResponse(result)
}
