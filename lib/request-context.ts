import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

export type RequestContext = {
  requestId: string
  correlationId?: string
  route?: string
  userId?: string
  sessionId?: string
  startedAt: number
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

export function getRequestContext(): RequestContext | null {
  return asyncLocalStorage.getStore() ?? null
}

export function getRequestId(): string | null {
  const store = asyncLocalStorage.getStore()
  return store?.requestId ?? null
}

export function getCorrelationId(): string | null {
  const store = asyncLocalStorage.getStore()
  return store?.correlationId ?? null
}

export function runWithRequestContext<T>(callback: () => Promise<T>, ctx?: string | Partial<RequestContext>): Promise<T> {
  const supplied: Partial<RequestContext> = typeof ctx === 'string' ? { requestId: ctx } : (ctx ?? {})
  const requestContext: RequestContext = {
    requestId: supplied.requestId ?? randomUUID(),
    correlationId: supplied.correlationId ?? supplied.requestId ?? randomUUID(),
    route: supplied.route,
    userId: supplied.userId,
    sessionId: supplied.sessionId,
    startedAt: supplied.startedAt ?? Date.now(),
  }

  return asyncLocalStorage.run(requestContext, callback)
}
