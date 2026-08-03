import { getRequestContext, runWithRequestContext } from '@/lib/request-context'
import { logger } from '@/lib/logger'
import { metricsService } from '@/server/services/metrics.service'

export interface RequestLoggingOptions {
  userId?: string
  sessionId?: string
}

export async function withRequestLogging<T>(req: Request, operation: string, callback: () => Promise<T>, options: RequestLoggingOptions = {}) {
  const requestId = req.headers.get('x-request-id') ?? undefined
  const correlationId = req.headers.get('x-correlation-id') ?? requestId
  return runWithRequestContext(async () => {
    const ctx = getRequestContext()
    logger.info('request.start', {
      requestId: ctx?.requestId ?? requestId ?? null,
      correlationId: ctx?.correlationId ?? correlationId ?? null,
      operation,
      path: req.url,
      method: req.method,
      userId: options.userId,
      sessionId: options.sessionId,
    })

    try {
      const result = await callback()
      metricsService.recordRequestSuccess()
      logger.info('request.complete', {
        requestId: ctx?.requestId ?? requestId ?? null,
        correlationId: ctx?.correlationId ?? correlationId ?? null,
        operation,
        userId: options.userId,
        sessionId: options.sessionId,
      })
      return result
    } catch (error: unknown) {
      metricsService.recordRequestFailure()
      logger.error('request.error', {
        requestId: ctx?.requestId ?? requestId ?? null,
        correlationId: ctx?.correlationId ?? correlationId ?? null,
        operation,
        userId: options.userId,
        sessionId: options.sessionId,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }, { requestId, correlationId, route: new URL(req.url).pathname, userId: options.userId, sessionId: options.sessionId })
}
