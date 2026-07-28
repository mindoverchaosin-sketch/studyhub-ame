import { NextResponse } from 'next/server'
import { bookmarkAction } from '@/server/actions/exam-attempt.actions'
import { withRequestLogging } from '@/lib/request-logger'
import { getRequestId } from '@/lib/request-context'

export async function POST(req: Request, context: any) {
  const params = context?.params ?? {}
  const body = await req.json()
  const { attemptQuestionId, bookmarked } = body
  if (!attemptQuestionId) return NextResponse.json({ error: 'attemptQuestionId required' }, { status: 400 })

  const result = await withRequestLogging(req, 'bookmarkAction', async () => {
    return bookmarkAction(attemptQuestionId, !!bookmarked)
  })

  const response = NextResponse.json(result)
  const requestId = getRequestId()
  if (requestId) response.headers.set('x-request-id', requestId)
  return response
}
