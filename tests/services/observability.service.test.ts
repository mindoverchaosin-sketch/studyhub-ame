import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  env: { ERROR_REPORT_WEBHOOK_URL: undefined as string | undefined },
}))

vi.mock('@/lib/env', () => ({ env: mocks.env }))
vi.mock('@/lib/request-context', () => ({ getRequestContext: () => null }))

async function importFresh() {
  vi.resetModules()
  return import('@/server/services/observability.service')
}

function silenceConsole() {
  return (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
    vi.spyOn(console, method).mockImplementation(() => {}),
  )
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('observability service fan-out', () => {
  let consoleSpies: ReturnType<typeof silenceConsole>

  beforeEach(() => {
    consoleSpies = silenceConsole()
  })

  afterEach(() => {
    for (const spy of consoleSpies) spy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('isolates a failing adapter so the remaining adapters and the report still run', async () => {
    const { ObservabilityService } = await importFresh()
    const obs = new ObservabilityService()

    const failing = vi.fn(() => {
      throw new Error('adapter down')
    })
    const healthy = vi.fn()
    obs.registerAdapter({
      recordCounter: () => {},
      recordGauge: () => {},
      recordTiming: () => {},
      captureError: failing,
    })
    obs.registerAdapter({
      recordCounter: () => {},
      recordGauge: () => {},
      recordTiming: () => {},
      captureError: healthy,
    })

    expect(() => obs.captureError(new Error('captured'), { service: 'billing' })).not.toThrow()
    expect(failing).toHaveBeenCalledOnce()
    expect(healthy).toHaveBeenCalledOnce()
  })

  it('registers no sink adapter when the webhook URL is absent', async () => {
    mocks.env.ERROR_REPORT_WEBHOOK_URL = undefined
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { observabilityService } = await importFresh()
    observabilityService.captureError(new Error('local-only'), { service: 'billing' })
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('adds the webhook sink adapter when the URL is configured', async () => {
    mocks.env.ERROR_REPORT_WEBHOOK_URL = 'https://sink.example.com/hook'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const { observabilityService } = await importFresh()
    observabilityService.captureError(new Error('ship it'), {
      service: 'billing',
      operation: 'razorpay-webhook',
      severity: 'high',
      metadata: { provider: 'razorpay', providerEventId: 'evt-9' },
    })
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://sink.example.com/hook')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toMatchObject({
      errorMessage: 'ship it',
      service: 'billing',
      operation: 'razorpay-webhook',
      severity: 'high',
      metadata: { provider: 'razorpay', providerEventId: 'evt-9' },
      requestId: null,
      correlationId: null,
    })
  })
})
