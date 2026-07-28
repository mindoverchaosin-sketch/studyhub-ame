import { runWithRequestContext } from '@/lib/request-context'
import { logger } from '@/lib/logger'
import { metricsService } from '@/server/services/metrics.service'

export async function withRequestLogging<T>(req: Request, operation: string, callback: () => Promise<T>) {
  const requestId = req.headers.get('x-request-id') ?? undefined
  return runWithRequestContext(async () => {
    logger.info('request.start', {
      requestId: requestId ?? null,
      operation,
      path: req.url,
      method: req.method,
    })

    try {
      const result = await callback()
      metricsService.recordRequestSuccess()
      logger.info('request.complete', {
        requestId: requestId ?? null,
        operation,
      })
      return result
    } catch (error: unknown) {
      metricsService.recordRequestFailure()
      logger.error('request.error', {
        requestId: requestId ?? null,
        operation,
        errorType: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }, requestId)
}
