import { NextResponse } from 'next/server'
import { loadAttemptAction } from '@/server/actions/exam-attempt.actions'
import { withRequestLogging } from '@/lib/request-logger'
import { getRequestId } from '@/lib/request-context'

export async function GET(req: Request, context: any) {
  const params = context?.params ?? {}
  const result = await withRequestLogging(req, 'loadAttemptAction', async () => {
    const attempt = await loadAttemptAction(params.attemptId)
    if (!attempt) return null
    return attempt
  })

  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const response = NextResponse.json(result)
  const requestId = getRequestId()
  if (requestId) response.headers.set('x-request-id', requestId)
  return response
}
