import { NextResponse, type NextRequest } from 'next/server'
import { requirePermission } from '@/auth'
import { masteroService } from '@/server/services/mastero.service'
import { normalizeMasteroApiError } from '@/server/services/mastero-api.service'
import type { MasteroAction, MasteroGenerationResult } from '@/types/mastero'
import type { MasteroApiErrorResponse, MasteroGenerateApiRequest, MasteroGenerateApiResponse } from '@/types/mastero-api'

const validActions = new Set<MasteroAction>([
  'GENERATE_EXPLANATION', 'GENERATE_STUDY_NOTES', 'SIMPLIFY', 'EXPAND', 'SUMMARIZE',
  'GENERATE_EXAMPLES', 'GENERATE_EXAM_TIPS', 'GENERATE_DEFINITIONS', 'GENERATE_BULLETS',
  'GENERATE_TABLE', 'IMPROVE_CONTENT', 'GENERATE_SECTION',
])
const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/
const idempotencyCache = new Map<string, { expiresAt: number; response: MasteroGenerateApiResponse }>()

function getRequestId(request: NextRequest) {
  const candidate = request.headers.get('x-request-id') ?? request.headers.get('x-correlation-id')
  return candidate && requestIdPattern.test(candidate) ? candidate : crypto.randomUUID()
}

function errorResponse(requestId: string, details: ReturnType<typeof normalizeMasteroApiError>) {
  const body: MasteroApiErrorResponse = { error: { code: details.code, message: details.message, requestId, retryable: details.retryable } }
  return NextResponse.json(body, { status: details.status, headers: { 'x-request-id': requestId } })
}

function parseRequest(value: unknown): MasteroGenerateApiRequest {
  if (!value || typeof value !== 'object') throw new Error('invalid request')
  const input = value as Record<string, unknown>
  if (typeof input.materialId !== 'string' || !input.materialId.trim()) throw new Error('invalid materialId')
  if (typeof input.action !== 'string' || !validActions.has(input.action as MasteroAction)) throw new Error('invalid action')
  if (input.selectedBlockId !== undefined && typeof input.selectedBlockId !== 'string') throw new Error('invalid selectedBlockId')
  if (input.instruction !== undefined && typeof input.instruction !== 'string') throw new Error('invalid instruction')
  if (input.requestId !== undefined && (typeof input.requestId !== 'string' || !requestIdPattern.test(input.requestId))) throw new Error('invalid requestId')
  if (input.idempotencyKey !== undefined && (typeof input.idempotencyKey !== 'string' || !requestIdPattern.test(input.idempotencyKey))) throw new Error('invalid idempotencyKey')
  return { materialId: input.materialId.trim(), action: input.action as MasteroAction, selectedBlockId: input.selectedBlockId as string | undefined, instruction: input.instruction as string | undefined, requestId: input.requestId as string | undefined, idempotencyKey: input.idempotencyKey as string | undefined }
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  try {
    let body: unknown
    try { body = await request.json() } catch { throw new Error('invalid request body') }
    const input = parseRequest(body)
    const key = input.idempotencyKey ? `${input.idempotencyKey}:${input.materialId}:${input.action}` : null
    if (key) {
      const cached = idempotencyCache.get(key)
      if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.response, { headers: { 'x-request-id': cached.response.requestId } })
      idempotencyCache.delete(key)
    }

    const session = await requirePermission('manageResources')
    const result = await masteroService.generate(session.user.id as string, { materialId: input.materialId, action: input.action, selectedBlockId: input.selectedBlockId, instruction: input.instruction })
    const response: MasteroGenerateApiResponse = { requestId, result: result as MasteroGenerationResult, review: { persisted: false, workflowChanged: false, requiresHumanReview: true } }
    if (key) idempotencyCache.set(key, { expiresAt: Date.now() + 60_000, response })
    return NextResponse.json(response, { headers: { 'x-request-id': requestId } })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('invalid')) return errorResponse(requestId, { status: 400, code: 'MASTERO_VALIDATION_ERROR', message: 'The Mastero request is invalid.', retryable: false })
    if (error instanceof Error && 'status' in error && (error as { status?: unknown }).status === 401) return errorResponse(requestId, { status: 401, code: 'MASTERO_UNAUTHORIZED', message: 'Authentication required.', retryable: false })
    if (error instanceof Error && 'status' in error && (error as { status?: unknown }).status === 403) return errorResponse(requestId, { status: 403, code: 'MASTERO_FORBIDDEN', message: 'Mastero access is not available for this account.', retryable: false })
    return errorResponse(requestId, normalizeMasteroApiError(error))
  }
}

export async function GET() {
  return NextResponse.json({ error: { code: 'MASTERO_VALIDATION_ERROR', message: 'Method not allowed.', requestId: crypto.randomUUID(), retryable: false } }, { status: 405, headers: { Allow: 'POST' } })
}