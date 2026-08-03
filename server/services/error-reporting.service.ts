import { logger } from '@/lib/logger'
import { getRequestContext } from '@/lib/request-context'

export interface ErrorReportContext {
  service?: string
  operation?: string
  extra?: Record<string, unknown>
}

export function sanitizeError(e: unknown): { message: string; name?: string } {
  if (e instanceof Error) {
    return { message: e.message, name: e.name }
  }
  return { message: String(e) }
}

export function reportError(e: unknown, ctx: ErrorReportContext = {}) {
  const rc = getRequestContext()
  const safe = sanitizeError(e)

  // Never include sensitive payloads here; keep fields minimal
  logger.error('error.report', {
    service: ctx.service ?? undefined,
    operation: ctx.operation ?? undefined,
    requestId: rc?.requestId ?? undefined,
    correlationId: rc?.correlationId ?? undefined,
    errorType: safe.name ?? undefined,
    errorMessage: safe.message,
    metadata: ctx.extra ?? undefined,
  })
}

export const errorReportingService = { reportError }
