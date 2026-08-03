import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getMetricsRoute } from '@/app/api/metrics/route'
import { instrumentService } from '@/lib/logger'
import { withRequestLogging } from '@/lib/request-logger'
import { serviceCache } from '@/server/services/cache'
import { metricsService } from '@/server/services/metrics.service'

describe('MetricsService', () => {
  beforeEach(() => {
    metricsService.reset()
    serviceCache.clear()
    vi.restoreAllMocks()
  })

  it('tracks request counters', async () => {
    const request = new Request('https://example.com/test', {
      method: 'GET',
      headers: { 'x-request-id': 'req-1' },
    })

    await withRequestLogging(request, 'metrics-test', async () => 'ok')

    await expect(withRequestLogging(request, 'metrics-test', async () => {
      throw new Error('boom')
    })).rejects.toThrow('boom')

    const snapshot = metricsService.getSnapshot()

    expect(snapshot.requests.total).toBe(2)
    expect(snapshot.requests.success).toBe(1)
    expect(snapshot.requests.failed).toBe(1)
  })

  it('records service execution timing', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00.000Z'))

    await expect(instrumentService('ExampleService', 'demo', async () => {
      vi.setSystemTime(new Date('2020-01-01T00:00:00.042Z'))
      return 'ok'
    })).resolves.toBe('ok')

    const snapshot = metricsService.getSnapshot()

    expect(snapshot.services.executions).toBe(1)
    expect(snapshot.services.averageDurationMs).toBe(42)

    vi.useRealTimers()
  })

  it('records timing from sync and async timing helpers', async () => {
    const nowSpy = vi.spyOn(Date, 'now')
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => 20)
      .mockImplementationOnce(() => 0)
      .mockImplementationOnce(() => 55)

    const { timeSync, timeAsync } = await import('@/lib/timing')

    const syncResult = timeSync('TimingHelper', 'syncOp', () => 'sync-ok')
    const asyncResult = await timeAsync('TimingHelper', 'asyncOp', async () => 'async-ok')

    expect(syncResult).toBe('sync-ok')
    expect(asyncResult).toBe('async-ok')

    const snapshot = metricsService.getSnapshot()
    expect(snapshot.services.executions).toBe(2)
    expect(snapshot.services.averageDurationMs).toBe(38)

    nowSpy.mockRestore()
  })

  it('tracks cache hit and miss counters', () => {
    serviceCache.get('missing-key')
    serviceCache.set('existing-key', { ok: true }, 60_000)
    serviceCache.get('existing-key')

    const snapshot = metricsService.getSnapshot()

    expect(snapshot.cache.hits).toBe(1)
    expect(snapshot.cache.misses).toBe(1)
    expect(snapshot.cache.hitRatio).toBe(0.5)
  })

  it('returns metrics endpoint response', async () => {
    metricsService.recordRequestSuccess()
    metricsService.recordServiceExecution(12, true)
    metricsService.recordCacheHit()
    metricsService.recordCacheMiss()

    const response = await getMetricsRoute()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.requests.total).toBe(1)
    expect(payload.services.executions).toBe(1)
    expect(payload.services.averageDurationMs).toBe(12)
    expect(payload.cache.hits).toBe(1)
    expect(payload.cache.misses).toBe(1)
    expect(payload.cache.hitRatio).toBe(0.5)
    expect(typeof payload.timestamp).toBe('string')
    expect(typeof payload.uptime).toBe('number')
  })
})
