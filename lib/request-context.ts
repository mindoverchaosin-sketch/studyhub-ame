import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

type RequestContext = {
  requestId: string
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

export function getRequestId(): string | null {
  const store = asyncLocalStorage.getStore()
  return store?.requestId ?? null
}

export function runWithRequestContext<T>(callback: () => Promise<T>, requestId?: string): Promise<T> {
  const requestContext: RequestContext = {
    requestId: requestId ?? randomUUID(),
  }

  return asyncLocalStorage.run(requestContext, callback)
}
