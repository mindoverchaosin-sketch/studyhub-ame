import { serviceCache } from '@/server/services/cache'

export type HealthStatus = 'healthy' | 'degraded'
export type HealthCheckStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface HealthSnapshot {
  status: HealthStatus
  timestamp: string
  uptime: number
  version: string
  environment: string
  nodeVersion: string
  checks: {
    database: HealthCheckStatus
    cache: HealthCheckStatus
    application: HealthCheckStatus
  }
}

export interface HealthServiceDependencies {
  databaseProbe?: () => Promise<boolean>
  cacheProbe?: () => HealthCheckStatus
  now?: () => number
  uptimeProvider?: () => number
  version?: string
  environment?: string
  nodeVersion?: string
}

export class HealthService {
  constructor(private readonly deps: HealthServiceDependencies = {}) {}

  async getHealthSnapshot(): Promise<HealthSnapshot> {
    const database = await this.getDatabaseStatus()
    const cache = this.getCacheStatus()
    const application = 'healthy'

    const status: HealthStatus = database === 'healthy' && cache === 'healthy' && application === 'healthy'
      ? 'healthy'
      : 'degraded'

    return {
      status,
      timestamp: new Date(this.deps.now?.() ?? Date.now()).toISOString(),
      uptime: this.deps.uptimeProvider?.() ?? process.uptime(),
      version: this.deps.version ?? process.env.npm_package_version ?? '0.1.0',
      environment: this.deps.environment ?? process.env.NODE_ENV ?? 'development',
      nodeVersion: this.deps.nodeVersion ?? process.version,
      checks: {
        database,
        cache,
        application,
      },
    }
  }

  private async getDatabaseStatus(): Promise<HealthCheckStatus> {
    try {
      const probe = this.deps.databaseProbe ?? this.defaultDatabaseProbe
      const result = await Promise.race([
        probe(),
        new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('database-check-timeout')), 300)
        }),
      ])

      return result ? 'healthy' : 'unhealthy'
    } catch (error) {
      return 'unhealthy'
    }
  }

  private getCacheStatus(): HealthCheckStatus {
    try {
      const probe = this.deps.cacheProbe ?? this.defaultCacheProbe
      const result = probe()
      return result === 'healthy' ? 'healthy' : 'degraded'
    } catch {
      return 'degraded'
    }
  }

  private async defaultDatabaseProbe(): Promise<boolean> {
    const prisma = await import('@/lib/prisma')
    await prisma.default.$queryRaw`SELECT 1`
    return true
  }

  private defaultCacheProbe(): HealthCheckStatus {
    return serviceCache.get('__health__') === null ? 'healthy' : 'healthy'
  }
}
