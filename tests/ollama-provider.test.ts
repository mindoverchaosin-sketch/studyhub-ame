import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasteroProviderRequest } from '@/types/mastero'

const { config } = vi.hoisted(() => ({ config: { provider: 'ollama' as const, openaiModel: 'gpt-5-mini', openaiApiKey: undefined, ollamaBaseUrl: 'http://localhost:11434', ollamaModel: 'qwen2.5:3b' } }))
vi.mock('@/server/services/mastero-config', () => ({ masteroConfig: config }))

import { OllamaProvider } from '@/server/services/ollama-provider'

const request: MasteroProviderRequest = { systemInstructions: 'system', context: {} as MasteroProviderRequest['context'], editorContent: 'editor content' }
const result = { blocks: [{ id: 'p1', type: 'paragraph', children: [{ text: 'Generated', format: [] }] }], sourceBlockIds: ['source-1'] }

describe('OllamaProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses non-streaming structured JSON with the existing schema', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: { content: JSON.stringify(result) } }), { status: 200 }))
    await expect(new OllamaProvider().generateStructuredContent(request)).resolves.toEqual(result)
    const [url, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(String(options?.body)) as { model: string; stream: boolean; format: unknown; options: { temperature: number }; messages: Array<{ role: string; content: string }> }
    expect(url).toBe('http://localhost:11434/api/chat')
    expect(body).toMatchObject({ model: 'qwen2.5:3b', stream: false, options: { temperature: 0 } })
    expect(body.format).toBeDefined()
    expect(body.messages).toEqual([{ role: 'system', content: 'system' }, { role: 'user', content: 'editor content' }])
  })

  it('supports the generate-style response field while still parsing structured JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ response: JSON.stringify(result) }), { status: 200 }))
    await expect(new OllamaProvider().generateStructuredContent(request)).resolves.toEqual(result)
  })

  it('rejects malformed structured output and normalizes availability errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ message: { content: '{bad json' } }), { status: 200 }))
    await expect(new OllamaProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT' })

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('not found', { status: 404 }))
    await expect(new OllamaProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_NOT_CONFIGURED', transient: false })
  })

  it('normalizes network and server failures as transient', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connection refused'))
    await expect(new OllamaProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_NETWORK', transient: true })

    vi.restoreAllMocks()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('busy', { status: 503 }))
    await expect(new OllamaProvider().generateStructuredContent(request)).rejects.toMatchObject({ code: 'MASTERO_PROVIDER_UNAVAILABLE', transient: true })
  })
})