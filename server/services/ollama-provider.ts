import type { MasteroProviderRequest, MasteroProviderResponse } from '@/types/mastero'
import { masteroConfig } from './mastero-config'
import { MasteroProviderError, type AIProvider } from './mastero-provider'
import { masteroStructuredResponseSchema } from './openai-provider'

type OllamaResponse = {
  message?: { content?: string }
  response?: string
}

function normalizeOllamaError(status: number): MasteroProviderError {
  if (status === 404) return new MasteroProviderError('Ollama model or service was not found.', { code: 'MASTERO_PROVIDER_NOT_CONFIGURED' })
  if (status === 429) return new MasteroProviderError('Ollama is busy or rate limited.', { code: 'MASTERO_PROVIDER_RATE_LIMITED', transient: true })
  if (status >= 500) return new MasteroProviderError('Ollama is temporarily unavailable.', { code: 'MASTERO_PROVIDER_UNAVAILABLE', transient: true })
  return new MasteroProviderError('Ollama rejected the request.', { code: 'MASTERO_PROVIDER_REQUEST_FAILED' })
}

export class OllamaProvider implements AIProvider {
  async generateStructuredContent(request: MasteroProviderRequest): Promise<MasteroProviderResponse> {
    const baseUrl = masteroConfig.ollamaBaseUrl.replace(/\/$/, '')
    let response: Response
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: masteroConfig.ollamaModel,
          stream: false,
          format: request.responseSchema ?? masteroStructuredResponseSchema,
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: request.systemInstructions },
            { role: 'user', content: request.editorContent },
          ],
        }),
      })
    } catch {
      throw new MasteroProviderError('Ollama network request failed.', { code: 'MASTERO_PROVIDER_NETWORK', transient: true })
    }

    const body = await response.text()
    if (!response.ok) throw normalizeOllamaError(response.status)

    let parsed: OllamaResponse
    try {
      parsed = JSON.parse(body) as OllamaResponse
    } catch {
      throw new MasteroProviderError('Ollama returned malformed JSON.', { code: 'MASTERO_PROVIDER_MALFORMED_RESPONSE' })
    }

    const content = parsed.message?.content ?? parsed.response
    if (!content) throw new MasteroProviderError('Ollama returned no structured content.', { code: 'MASTERO_PROVIDER_EMPTY_RESPONSE' })

    try {
      const result = JSON.parse(content) as MasteroProviderResponse
      if (!result || !Array.isArray(result.blocks)) throw new Error('blocks must be an array')
      return result
    } catch {
      throw new MasteroProviderError('Ollama returned malformed structured output.', { code: 'MASTERO_PROVIDER_MALFORMED_OUTPUT' })
    }
  }
}