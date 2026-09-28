import { NextResponse } from 'next/server'
import { submitAttemptAction } from '@/server/actions/exam-attempt.actions'
import { withRequestLogging } from '@/lib/request-logger'
import { getRequestId } from '@/lib/request-context'

export async function POST(req: Request, context: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await context.params
  const result = await withRequestLogging(req, 'submitAttemptAction', async () => {
    return submitAttemptAction(attemptId)
  })
  const response = NextResponse.json(result)
  const requestId = getRequestId()
  if (requestId) response.headers.set('x-request-id', requestId)
  return response
}
