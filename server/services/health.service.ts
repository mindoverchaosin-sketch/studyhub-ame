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
    aiProvider: HealthCheckStatus
    mediaProvider: HealthCheckStatus
  }
}

export interface HealthServiceDependencies {
  databaseProbe?: () => Promise<boolean>
  cacheProbe?: () => HealthCheckStatus
  aiProviderProbe?: () => Promise<boolean>
  mediaProviderProbe?: () => Promise<boolean>
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
    const aiProvider = await this.getAIProviderStatus()
    const mediaProvider = await this.getMediaProviderStatus()
    const application = 'healthy'

    const status: HealthStatus = [database, cache, application, aiProvider, mediaProvider].every(
      (check) => check === 'healthy',
    )
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
        aiProvider,
        mediaProvider,
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
    } catch {
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

  private async getAIProviderStatus(): Promise<HealthCheckStatus> {
    try {
      const probe = this.deps.aiProviderProbe ?? this.defaultAIProviderProbe
      const result = await Promise.race([
        probe(),
        new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('ai-provider-check-timeout')), 300)
        }),
      ])
      return result ? 'healthy' : 'unhealthy'
    } catch {
      return 'unhealthy'
    }
  }

  private async getMediaProviderStatus(): Promise<HealthCheckStatus> {
    try {
      const probe = this.deps.mediaProviderProbe ?? this.defaultMediaProviderProbe
      const result = await probe()
      return result ? 'healthy' : 'unhealthy'
    } catch {
      return 'unhealthy'
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

  private async defaultAIProviderProbe(): Promise<boolean> {
    const providerName = process.env.AI_PROVIDER?.toLowerCase() ?? 'mock'

    if (providerName === 'mock') return true
    if (providerName === 'openai') return Boolean(process.env.OPENAI_API_KEY)
    if (providerName === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY)
    if (providerName === 'gemini' || providerName === 'google-gemini') {
      return Boolean(process.env.GOOGLE_API_KEY || process.env.GOOGLE_CLOUD_API_KEY)
    }

    return true
  }

  private async defaultMediaProviderProbe(): Promise<boolean> {
    return true
  }
}
