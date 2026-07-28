import { metricsService } from '@/server/services/metrics.service'

type CacheValue<T> = { value: T; expiresAt: number }

class ServiceCache {
  private store = new Map<string, CacheValue<unknown>>()

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) {
      metricsService.recordCacheMiss()
      return null
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      metricsService.recordCacheMiss()
      return null
    }
    metricsService.recordCacheHit()
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export const serviceCache = new ServiceCache()

export function getCacheKey(prefix: string, studentId: string): string {
  return `${prefix}:${studentId}`
}

export function withServiceCache<T>(
  cacheKey: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = serviceCache.get<T>(cacheKey)
  if (cached !== null) {
    return Promise.resolve(cached)
  }

  return loader().then((value) => {
    serviceCache.set(cacheKey, value, ttlMs)
    return value
  })
}

export function invalidateServiceCache(prefix: string, studentId?: string): void {
  if (studentId) {
    serviceCache.delete(getCacheKey(prefix, studentId))
    return
  }

  for (const key of Array.from(serviceCache['store'].keys())) {
    if (key.startsWith(prefix)) {
      serviceCache.delete(key)
    }
  }
}
