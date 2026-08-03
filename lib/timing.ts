import { metricsService } from '@/server/services/metrics.service'

export function timeSync<T>(service: string, operation: string, callback: () => T): T {
  const start = Date.now()
  try {
    return callback()
  } finally {
    const durationMs = Date.now() - start
    metricsService.recordTiming(`${service}.${operation}`, durationMs)
  }
}

export async function timeAsync<T>(service: string, operation: string, callback: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    return await callback()
  } finally {
    const durationMs = Date.now() - start
    metricsService.recordTiming(`${service}.${operation}`, durationMs)
  }
}
