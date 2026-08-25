import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/request-context', () => ({
  getRequestContext: vi.fn(() => ({ requestId: 'req-1', correlationId: 'corr-9' })),
}))

import { WebhookSinkMonitoringAdapter } from '@/server/services/adapters/webhook-sink-monitoring.adapter'

const SINK_URL = 'https://sink.example.com/hook'

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('webhook sink monitoring adapter', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts a sanitized structured payload to the configured sink', async () => {
    const adapter = new WebhookSinkMonitoringAdapter(SINK_URL)

    adapter.captureError(new Error('boom'), {
      service: 'billing',
      operation: 'razorpay-webhook',
      severity: 'high',
      category: 'processing',
      metadata: { provider: 'razorpay', providerEventId: 'evt-1' },
    })
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(SINK_URL)
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'content-type': 'application/json' })

    const body = JSON.parse(init.body)
    expect(body).toMatchObject({
      errorType: 'Error',
      errorMessage: 'boom',
      service: 'billing',
      operation: 'razorpay-webhook',
      severity: 'high',
      category: 'processing',
      metadata: { provider: 'razorpay', providerEventId: 'evt-1' },
      requestId: 'req-1',
      correlationId: 'corr-9',
    })
    // Sanitization contract: stacks and raw payloads never reach the wire.
    expect(body.stack).toBeUndefined()
    expect(init.body).not.toContain('stack')
  })

  it('stringifies non-Error captures without an errorType', async () => {
    const adapter = new WebhookSinkMonitoringAdapter(SINK_URL)

    adapter.captureError('plain string failure')
    await flush()

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.errorMessage).toBe('plain string failure')
    expect(body.errorType).toBeNull()
  })

  it('swallows transport failures without throwing or retrying', async () => {
    fetchMock.mockRejectedValue(new Error('network down'))
    const adapter = new WebhookSinkMonitoringAdapter(SINK_URL)

    expect(() =>
      adapter.captureError(new Error('original'), { service: 'billing' }),
    ).not.toThrow()

    await flush()

    // Exactly one attempt: at-most-once delivery is the contract.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('aborts delivery when the timeout elapses and still performs one attempt only', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => reject(new Error('aborted')))
        }),
    )
    const adapter = new WebhookSinkMonitoringAdapter(SINK_URL, 10)

    expect(() => adapter.captureError(new Error('slow case'))).not.toThrow()

    await new Promise((resolve) => setTimeout(resolve, 40))

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('keeps metric methods as inert no-ops', () => {
    const adapter = new WebhookSinkMonitoringAdapter(SINK_URL)

    expect(() => {
      adapter.recordCounter('counter')
      adapter.recordGauge('gauge', 5)
      adapter.recordTiming('timing', 12)
    }).not.toThrow()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
