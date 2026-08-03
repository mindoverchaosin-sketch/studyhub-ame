export interface MetricsSnapshot {
  requests: {
    total: number
    success: number
    failed: number
  }
  services: {
    executions: number
    averageDurationMs: number
  }
  cache: {
    hits: number
    misses: number
    hitRatio: number
  }
  ai: {
    requests: number
    streamingSessions: number
    providerFailures: number
    tokenUsage: number
  }
  uptime: number
  timestamp: string
}

export class MetricsService {
  private requestsTotal = 0
  private requestsSuccess = 0
  private requestsFailed = 0
  private serviceExecutions = 0
  private serviceDurationMsTotal = 0
  private cacheHits = 0
  private cacheMisses = 0
  // AI-specific metrics
  private aiRequests = 0
  private aiStreamingSessions = 0
  private aiProviderFailures = 0
  private aiTokenUsageTotal = 0

  recordRequestSuccess(): void {
    this.requestsTotal += 1
    this.requestsSuccess += 1
  }

  recordRequestFailure(): void {
    this.requestsTotal += 1
    this.requestsFailed += 1
  }

  recordServiceExecution(durationMs: number, success: boolean): void {
    this.serviceExecutions += 1
    this.serviceDurationMsTotal += durationMs
    if (success) {
      this.requestsSuccess += 0
    }
  }

  recordCacheHit(): void {
    this.cacheHits += 1
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1
  }

  recordAIRequest(): void {
    this.aiRequests += 1
  }

  recordAIStreamingStart(): void {
    this.aiStreamingSessions += 1
  }

  recordAIStreamingEnd(): void {
    // streaming end is implicit; counter remains as concurrent sessions is not tracked here
  }

  recordAIProviderFailure(): void {
    this.aiProviderFailures += 1
  }

  recordAITokenUsage(tokens: number): void {
    if (typeof tokens === 'number' && tokens > 0) this.aiTokenUsageTotal += tokens
  }

  recordTiming(metricName: string, durationMs: number): void {
    // Lightweight timing recorder - map to service execution for now
    this.serviceExecutions += 1
    this.serviceDurationMsTotal += durationMs
  }

  getSnapshot(): MetricsSnapshot {
    return {
      requests: {
        total: this.requestsTotal,
        success: this.requestsSuccess,
        failed: this.requestsFailed,
      },
      services: {
        executions: this.serviceExecutions,
        averageDurationMs: this.serviceExecutions === 0 ? 0 : Math.round(this.serviceDurationMsTotal / this.serviceExecutions),
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRatio: this.cacheHits + this.cacheMisses === 0 ? 0 : this.cacheHits / (this.cacheHits + this.cacheMisses),
      },
      ai: {
        requests: this.aiRequests,
        streamingSessions: this.aiStreamingSessions,
        providerFailures: this.aiProviderFailures,
        tokenUsage: this.aiTokenUsageTotal,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }

  reset(): void {
    this.requestsTotal = 0
    this.requestsSuccess = 0
    this.requestsFailed = 0
    this.serviceExecutions = 0
    this.serviceDurationMsTotal = 0
    this.cacheHits = 0
    this.cacheMisses = 0
    this.aiRequests = 0
    this.aiStreamingSessions = 0
    this.aiProviderFailures = 0
    this.aiTokenUsageTotal = 0
  }
}

export const metricsService = new MetricsService()
