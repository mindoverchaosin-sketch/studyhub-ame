import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { ForbiddenError, UnauthorizedError } from '@/lib/auth'

const { requirePermission, generate, config, isMasteroGenerationReady } = vi.hoisted(() => ({
  requirePermission: vi.fn(),
  generate: vi.fn(),
  isMasteroGenerationReady: vi.fn((masteroConfig: { provider: 'openai' | 'ollama'; openaiApiKey?: string; ollamaBaseUrl?: string; ollamaModel?: string }) => {
    if (masteroConfig.provider === 'ollama') {
      return Boolean(masteroConfig.ollamaBaseUrl?.trim()) && Boolean(masteroConfig.ollamaModel?.trim())
    }
    if (masteroConfig.provider === 'openai') {
      return Boolean(masteroConfig.openaiApiKey?.trim())
    }
    return false
  }),
  config: {
    provider: 'openai' as 'openai' | 'ollama',
    openaiModel: 'gpt-5-mini',
    openaiApiKey: undefined as string | undefined,
    ollamaBaseUrl: 'http://localhost:11434',
    ollamaModel: 'qwen2.5:1.5b',
  },
}))

vi.mock('@/auth', () => ({ requirePermission }))
vi.mock('@/server/services/mastero.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/services/mastero.service')>()
  return { ...actual, masteroService: { generate } }
})
vi.mock('@/server/services/mastero-config', () => ({ masteroConfig: config, isMasteroGenerationReady }))

import { POST } from '@/app/api/v1/mastero/generate/route'
import { GET as health } from '@/app/api/v1/mastero/health/route'

const generated = {
  blocks: [{ id: 'generated-1', type: 'paragraph', children: [{ text: 'Generated', format: [] }] }],
  sourceBlockIds: ['source-1'],
  action: 'GENERATE_EXPLANATION' as const,
  generatedAt: '2026-09-06T00:00:00.000Z',
}

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/v1/mastero/generate', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
}

describe('Mastero generation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generate.mockResolvedValue(generated)
    requirePermission.mockResolvedValue({ user: { id: 'editor-1', role: 'CONTENT_EDITOR' } })
  })

  it.each(['ADMIN', 'CONTENT_EDITOR', 'SUPER_ADMIN'])('allows %s through manageResources and returns provider-neutral output', async (role) => {
    requirePermission.mockResolvedValue({ user: { id: `${role}-1`, role } })
    const response = await POST(request({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' }, { 'x-request-id': 'req-api-1' }))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(response.headers.get('x-request-id')).toBe('req-api-1')
    expect(body).toEqual({ requestId: 'req-api-1', result: generated, review: { persisted: false, workflowChanged: false, requiresHumanReview: true } })
    expect(requirePermission).toHaveBeenCalledWith('manageResources')
    expect(generate).toHaveBeenCalledWith(`${role}-1`, { materialId: 'material-1', action: 'GENERATE_EXPLANATION', selectedBlockId: undefined, instruction: undefined })
  })

  it('rejects missing authentication and forbidden roles with generic envelopes', async () => {
    requirePermission.mockRejectedValueOnce(new UnauthorizedError())
    const unauthenticated = await POST(request({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' }))
    expect(unauthenticated.status).toBe(401)
    expect((await unauthenticated.json()).error).toMatchObject({ code: 'MASTERO_UNAUTHORIZED', retryable: false })

    requirePermission.mockRejectedValueOnce(new ForbiddenError())
    const forbidden = await POST(request({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' }))
    expect(forbidden.status).toBe(403)
    expect((await forbidden.json()).error).toMatchObject({ code: 'MASTERO_FORBIDDEN', retryable: false })
    expect(generate).not.toHaveBeenCalled()
  })

  it('rejects malformed requests before calling the service', async () => {
    const response = await POST(request({ materialId: 'material-1', action: 'NOT_SUPPORTED', userId: 'attacker' }))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toMatchObject({ code: 'MASTERO_VALIDATION_ERROR' })
    expect(generate).not.toHaveBeenCalled()
  })

  it('normalizes service failures and never returns provider internals', async () => {
    generate.mockRejectedValueOnce({ code: 'MASTERO_PROVIDER_TIMEOUT', message: 'secret provider stack trace', transient: true })
    const timeout = await POST(request({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' }))
    expect(timeout.status).toBe(504)
    expect((await timeout.json()).error).toMatchObject({ code: 'MASTERO_PROVIDER_TIMEOUT', message: 'Mastero took too long to respond.', retryable: true })

    generate.mockRejectedValueOnce({ code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT', message: 'raw provider body' })
    const malformed = await POST(request({ materialId: 'material-1', action: 'GENERATE_EXPLANATION' }))
    expect(malformed.status).toBe(502)
    expect(JSON.stringify(await malformed.json())).not.toContain('raw provider body')
  })

  it('supports idempotency without invoking the service twice', async () => {
    const body = { materialId: 'material-idempotent', action: 'SUMMARIZE', idempotencyKey: 'idem-1' }
    const first = await POST(request(body))
    const second = await POST(request(body))
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(generate).toHaveBeenCalledTimes(1)
  })
})

describe('Mastero health API', () => {
  beforeEach(() => {
    config.provider = 'openai'
    config.openaiModel = 'gpt-5-mini'
    config.openaiApiKey = undefined
    config.ollamaBaseUrl = 'http://localhost:11434'
    config.ollamaModel = 'qwen2.5:1.5b'
  })

  it('reports ready for configured Ollama provider', async () => {
    config.provider = 'ollama'
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ready', service: 'mastero', apiVersion: 'v1', generationAvailable: true })
  })

  it('reports degraded for Ollama provider when required config is missing', async () => {
    config.provider = 'ollama'
    config.ollamaModel = ''
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'degraded', service: 'mastero', apiVersion: 'v1', generationAvailable: false })
  })

  it('reports degraded for OpenAI without an API key', async () => {
    config.provider = 'openai'
    config.openaiApiKey = undefined
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'degraded', service: 'mastero', apiVersion: 'v1', generationAvailable: false })
  })

  it('reports ready for OpenAI when an API key is configured', async () => {
    config.provider = 'openai'
    config.openaiApiKey = 'sk-test-key'
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ready', service: 'mastero', apiVersion: 'v1', generationAvailable: true })
  })

  it('never exposes secrets in the health response', async () => {
    config.provider = 'openai'
    config.openaiApiKey = 'sk-super-secret-value'
    const response = await health()
    const body = await response.json()
    expect(body).toEqual({ status: 'ready', service: 'mastero', apiVersion: 'v1', generationAvailable: true })
    expect(JSON.stringify(body)).not.toContain('sk-super-secret-value')
  })
})