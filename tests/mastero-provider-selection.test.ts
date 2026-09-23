import { describe, expect, it, vi } from 'vitest'

describe('Mastero provider availability', () => {
  it('keeps the existing OpenAI provider available alongside Ollama', async () => {
    const { OpenAIProvider } = await import('@/server/services/openai-provider')
    const { OllamaProvider } = await import('@/server/services/ollama-provider')
    expect(new OpenAIProvider()).toBeInstanceOf(OpenAIProvider)
    expect(new OllamaProvider()).toBeInstanceOf(OllamaProvider)
    expect(vi.isMockFunction(globalThis.fetch)).toBe(false)
  })
})