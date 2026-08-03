import { getRequestContext } from '@/lib/request-context'
import { errorReportingService } from '@/server/services/error-reporting.service'

export interface TraceContext {
  requestId: string
  correlationId?: string
  route?: string
  userId?: string
  sessionId?: string
  startedAt: number
}

export interface ErrorReportDetails {
  service?: string
  operation?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  category?: string
  metadata?: Record<string, unknown>
}

export interface MonitoringAdapter {
  recordCounter(name: string, value?: number): void
  recordGauge(name: string, value: number): void
  recordTiming(name: string, durationMs: number): void
  captureError?(error: unknown, details?: ErrorReportDetails): void
}

class ConsoleMonitoringAdapter implements MonitoringAdapter {
  private format(payload: Record<string, unknown>) {
    return JSON.stringify({ timestamp: new Date().toISOString(), ...payload })
  }

  recordCounter(name: string, value = 1): void {
    console.info(this.format({ type: 'monitoring.counter', name, value }))
  }

  recordGauge(name: string, value: number): void {
    console.info(this.format({ type: 'monitoring.gauge', name, value }))
  }

  recordTiming(name: string, durationMs: number): void {
    console.info(this.format({ type: 'monitoring.timing', name, durationMs }))
  }

  captureError(error: unknown, details: ErrorReportDetails = {}): void {
    const safeError = error instanceof Error ? { name: error.name, message: error.message } : { message: String(error) }
    console.error(this.format({ type: 'monitoring.error', error: safeError, details }))
  }
}

export class ObservabilityService {
  private adapters: MonitoringAdapter[] = []

  registerAdapter(adapter: MonitoringAdapter): void {
    this.adapters.push(adapter)
  }

  recordCounter(name: string, value = 1): void {
    for (const adapter of this.adapters) {
      adapter.recordCounter(name, value)
    }
  }

  recordGauge(name: string, value: number): void {
    for (const adapter of this.adapters) {
      adapter.recordGauge(name, value)
    }
  }

  recordTiming(name: string, durationMs: number): void {
    for (const adapter of this.adapters) {
      adapter.recordTiming(name, durationMs)
    }
  }

  captureError(error: unknown, details: ErrorReportDetails = {}): void {
    for (const adapter of this.adapters) {
      adapter.captureError?.(error, details)
    }
    errorReportingService.reportError(error, {
      service: details.service,
      operation: details.operation,
      extra: {
        severity: details.severity,
        category: details.category,
        metadata: details.metadata,
      },
    })
  }

  getCurrentTrace(): TraceContext | null {
    return getRequestContext()
  }
}

export const observabilityService = new ObservabilityService()
observabilityService.registerAdapter(new ConsoleMonitoringAdapter())
