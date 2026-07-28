import { NextResponse } from 'next/server'
import { markForReviewAction } from '@/server/actions/exam-attempt.actions'
import { withRequestLogging } from '@/lib/request-logger'
import { getRequestId } from '@/lib/request-context'

export async function POST(req: Request, context: any) {
  const params = context?.params ?? {}
  const body = await req.json()
  const { attemptQuestionId, markedForReview } = body
  if (!attemptQuestionId) return NextResponse.json({ error: 'attemptQuestionId required' }, { status: 400 })

  const result = await withRequestLogging(req, 'markForReviewAction', async () => {
    return markForReviewAction(attemptQuestionId, !!markedForReview)
  })
  const response = NextResponse.json(result)
  const requestId = getRequestId()
  if (requestId) response.headers.set('x-request-id', requestId)
  return response
}
