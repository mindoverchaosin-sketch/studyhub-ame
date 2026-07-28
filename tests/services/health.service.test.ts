import { describe, expect, it } from 'vitest'
import { HealthService } from '@/server/services/health.service'

describe('HealthService', () => {
  it('returns a healthy response when database and cache checks pass', async () => {
    const service = new HealthService({
      databaseProbe: async () => true,
      cacheProbe: () => 'healthy',
      now: () => 1_700_000_000_000,
      uptimeProvider: () => 42.5,
      version: '1.2.3',
      environment: 'test',
      nodeVersion: 'v20.11.0',
    })

    const result = await service.getHealthSnapshot()

    expect(result.status).toBe('healthy')
    expect(result.checks.database).toBe('healthy')
    expect(result.checks.cache).toBe('healthy')
    expect(result.checks.application).toBe('healthy')
    expect(result.uptime).toBe(42.5)
    expect(result.version).toBe('1.2.3')
    expect(result.environment).toBe('test')
    expect(result.nodeVersion).toBe('v20.11.0')
  })

  it('marks database as unhealthy when the database probe fails', async () => {
    const service = new HealthService({
      databaseProbe: async () => {
        throw new Error('db unavailable')
      },
      cacheProbe: () => 'healthy',
    })

    const result = await service.getHealthSnapshot()

    expect(result.checks.database).toBe('unhealthy')
    expect(result.status).toBe('degraded')
  })

  it('marks cache as degraded when the cache probe throws', async () => {
    const service = new HealthService({
      databaseProbe: async () => true,
      cacheProbe: () => {
        throw new Error('cache unavailable')
      },
    })

    const result = await service.getHealthSnapshot()

    expect(result.checks.cache).toBe('degraded')
    expect(result.status).toBe('degraded')
  })

  it('returns a safe degraded response for malformed internal errors', async () => {
    const service = new HealthService({
      databaseProbe: async () => {
        throw { message: 42 }
      },
      cacheProbe: () => {
        throw 'bad cache state'
      },
    })

    const result = await service.getHealthSnapshot()

    expect(result.checks.database).toBe('unhealthy')
    expect(result.checks.cache).toBe('degraded')
    expect(result.status).toBe('degraded')
    expect(result.timestamp).toBeTruthy()
  })
})
