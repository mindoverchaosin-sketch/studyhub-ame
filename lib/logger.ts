import { getRequestContext } from '@/lib/request-context'
import { metricsService } from '@/server/services/metrics.service'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogPayload = {
  service?: string
  operation?: string
  requestId?: string | null
  correlationId?: string | null
  durationMs?: number
  errorType?: string
  errorMessage?: string
  [key: string]: unknown
}

const isProduction = process.env.NODE_ENV === 'production'

function formatLog(level: LogLevel, message: string, payload: LogPayload = {}) {
  const ctx = getRequestContext()
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    requestId: payload.requestId ?? ctx?.requestId ?? null,
    correlationId: payload.correlationId ?? ctx?.correlationId ?? null,
    service: payload.service ?? null,
    operation: payload.operation ?? null,
    durationMs: payload.durationMs ?? undefined,
    ...payload,
  }
  const output = JSON.stringify(entry)

  if (isProduction) {
    console.log(output)
  } else {
    const consoleMethod = level === 'debug' ? console.debug : level === 'warn' ? console.warn : level === 'error' ? console.error : console.info
    consoleMethod.call(console, output)
  }
}

export const logger = {
  debug(message: string, payload?: LogPayload) {
    formatLog('debug', message, payload)
  },

  info(message: string, payload?: LogPayload) {
    formatLog('info', message, payload)
  },

  warn(message: string, payload?: LogPayload) {
    formatLog('warn', message, payload)
  },

  error(message: string, payload?: LogPayload) {
    formatLog('error', message, payload)
  },
}

export async function instrumentService<T>(service: string, operation: string, callback: () => Promise<T>): Promise<T> {
  const ctx = getRequestContext()
  const requestId = ctx?.requestId ?? null
  const correlationId = ctx?.correlationId ?? null
  const start = Date.now()
  logger.info('service.start', { service, operation, requestId, correlationId })

  try {
    const result = await callback()
    const durationMs = Date.now() - start
    metricsService.recordServiceExecution(durationMs, true)
    logger.info('service.complete', { service, operation, requestId, correlationId, durationMs })
    return result
  } catch (error: unknown) {
    const durationMs = Date.now() - start
    metricsService.recordServiceExecution(durationMs, false)
    logger.error('service.error', {
      service,
      operation,
      requestId,
      correlationId,
      durationMs,
      errorType: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}
