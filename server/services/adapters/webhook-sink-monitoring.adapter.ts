import { getRequestContext } from '@/lib/request-context'
import type { ErrorReportDetails, MonitoringAdapter } from '@/server/services/observability.service'

const DEFAULT_TIMEOUT_MS = 2000

/**
 * Provider-neutral error sink: delivers sanitized captureError payloads to a
 * configurable HTTP endpoint. Fire-and-forget with a short timeout and a
 * single attempt — the external sink must never break billing or cron
 * execution, and durable records (e.g. FAILED webhook rows) remain the
 * authoritative persistence layer.
 */
export class WebhookSinkMonitoringAdapter implements MonitoringAdapter {
  private readonly sinkUrl: string
  private readonly timeoutMs: number

  constructor(sinkUrl: string, timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.sinkUrl = sinkUrl
    this.timeoutMs = timeoutMs
  }

  recordCounter(_name: string, _value?: number): void {}

  recordGauge(_name: string, _value: number): void {}

  recordTiming(_name: string, _durationMs: number): void {}

  captureError(error: unknown, details: ErrorReportDetails = {}): void {
    void this.deliver(error, details)
  }

  private async deliver(error: unknown, details: ErrorReportDetails): Promise<void> {
    const safeError = error instanceof Error
      ? { name: error.name, message: error.message }
      : { name: null, message: String(error) }
    const ctx = getRequestContext()

    // Structured, sanitized fields only: no stacks, raw bodies, secrets,
    // signatures or tokens ever reach the wire.
    const body = {
      errorType: safeError.name,
      errorMessage: safeError.message,
      service: details.service ?? null,
      operation: details.operation ?? null,
      severity: details.severity ?? null,
      category: details.category ?? null,
      metadata: details.metadata ?? null,
      requestId: ctx?.requestId ?? null,
      correlationId: ctx?.correlationId ?? null,
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      await fetch(this.sinkUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch {
      // Swallow transport/timeout failures: at-most-once delivery is the
      // contract; the console adapter and durable records cover the rest.
    } finally {
      clearTimeout(timer)
    }
  }
}
