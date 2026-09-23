import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasteroProviderRequest } from '@/types/mastero'

const { config } = vi.hoisted(() => ({ config: { provider: 'openai' as const, openaiModel: 'gpt-5-mini', openaiApiKey: 'test-key' as string | undefined } }))
vi.mock('@/server/services/mastero-config', () => ({ masteroConfig: config }))

import { OpenAIProvider, masteroOpenAIResponseSchema } from '@/server/services/openai-provider'
import { MasteroProviderNotConfiguredError } from '@/server/services/mastero-provider'

const request: MasteroProviderRequest = {
  systemInstructions: 'system instructions',
  context: {} as MasteroProviderRequest['context'],
  editorContent: 'untrusted editor content',
}

function responseBody(output: unknown, extra: Record<string, unknown> = {}) {
  return JSON.stringify({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(output) }] }], ...extra })
}

describe('OpenAIProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    config.openaiApiKey = 'test-key'
  })

  it('returns a clean not-configured error when the key is absent', async () => {
    config.openaiApiKey = undefined
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toBeInstanceOf(MasteroProviderNotConfiguredError)
  })

  it('requests strict structured output and parses provider blocks', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(responseBody({ blocks: [{ id: 'p1', type: 'paragraph', children: [{ text: 'Generated', format: [] }] }], sourceBlockIds: ['source-1'] }), { status: 200 }))
    const result = await new OpenAIProvider().generateStructuredContent(request)

    expect(result.blocks).toHaveLength(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { model: string; text: { format: { type: string; strict: boolean; schema: unknown } } }
    expect(body.model).toBe('gpt-5-mini')
    expect(body.text.format).toMatchObject({ type: 'json_schema', strict: true })
    expect(body.text.format.schema).toEqual(masteroOpenAIResponseSchema)
  })

  it('normalizes authentication, rate-limit, network, and malformed output failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('unauthorized', { status: 401 }))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_AUTHENTICATION', transient: false })

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('rate limited', { status: 429 }))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_RATE_LIMITED', transient: true })

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(responseBody({ blocks: 'not-an-array' }), { status: 200 }))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT' })
  })

  it('handles incomplete and refusal responses without exposing provider details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }), { status: 200 }))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_INCOMPLETE' })

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'private provider detail' }] }] }), { status: 200 }))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_REFUSAL' })
  })

  it('does not include the API key in request errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network failure'))
    await expect(new OpenAIProvider().generateStructuredContent(request)).rejects.toSatisfy((error: unknown) => error instanceof Error && !error.message.includes('test-key'))
  })
})