import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('service cache', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('caches repeated reads for the same key', async () => {
    const { serviceCache, withServiceCache, getCacheKey } = await import('../../server/services/cache')
    const calls = vi.fn(async () => ({ value: 1 }))

    const first = await withServiceCache(getCacheKey('dashboard-summary', 'u1'), 5_000, calls)
    const second = await withServiceCache(getCacheKey('dashboard-summary', 'u1'), 5_000, calls)

    expect(first).toEqual({ value: 1 })
    expect(second).toEqual({ value: 1 })
    expect(calls).toHaveBeenCalledTimes(1)
    expect(serviceCache.get(getCacheKey('dashboard-summary', 'u1'))).toEqual({ value: 1 })
  })

  it('invalidates entries for a specific student', async () => {
    const { serviceCache, withServiceCache, getCacheKey, invalidateServiceCache } = await import('../../server/services/cache')
    await withServiceCache(getCacheKey('goal-progress', 'u2'), 5_000, async () => ({ value: 42 }))

    invalidateServiceCache('goal-progress', 'u2')

    expect(serviceCache.get(getCacheKey('goal-progress', 'u2'))).toBeNull()
  })

  it('prevents stale data from being served after expiry', async () => {
    const { serviceCache, withServiceCache, getCacheKey } = await import('../../server/services/cache')
    const calls = vi.fn(async () => ({ value: 1 }))

    await withServiceCache(getCacheKey('study-planner', 'u3'), 1, calls)
    await new Promise((resolve) => setTimeout(resolve, 10))
    const result = await withServiceCache(getCacheKey('study-planner', 'u3'), 1, calls)

    expect(result).toEqual({ value: 1 })
    expect(calls).toHaveBeenCalledTimes(2)
  })

  it('bypasses the cache after invalidation from a mutation path', async () => {
    const { withServiceCache, getCacheKey, invalidateServiceCache } = await import('../../server/services/cache')
    const calls = vi.fn(async () => ({ value: 1 }))

    await withServiceCache(getCacheKey('achievement-summary', 'u4'), 5_000, calls)
    invalidateServiceCache('achievement-summary', 'u4')
    await withServiceCache(getCacheKey('achievement-summary', 'u4'), 5_000, calls)

    expect(calls).toHaveBeenCalledTimes(2)
  })
})
