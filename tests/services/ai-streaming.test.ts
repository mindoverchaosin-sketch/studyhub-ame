import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AIService } from '@/server/services/ai/ai-service'
import { conversationService } from '@/server/services/ai/conversation.service'
import type { AIRequestContext } from '@/types/ai'

const canUseAITutorMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canUseAITutor: canUseAITutorMock,
  },
}))

class NonStreamingProvider {
  async generateResponse({ prompt }: AIRequestContext) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `fallback response for ${prompt}`,
      createdAt: new Date().toISOString(),
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 2, totalTokens: 3 },
      model: 'fallback',
      metadata: { provider: 'fallback' },
    }
  }

  async generateExplanation() {
    return {
      answer: 'Answer',
      simplified: 'Simple answer',
      relatedConcepts: ['Concept 1'],
      commonMistakes: ['Mistake 1'],
      similarQuestions: ['Question 1'],
    }
  }
}

describe('AIService streaming', () => {
  const createdConversationIds: string[] = []

  beforeEach(() => {
    vi.restoreAllMocks()
    canUseAITutorMock.mockReset()
    canUseAITutorMock.mockResolvedValue({ allowed: true, requiredFeature: 'aiTools' })
  })

  afterEach(() => {
    createdConversationIds.forEach((conversationId) => conversationService.deleteConversation(conversationId))
    createdConversationIds.length = 0
  })

  it('streams delta chunks and persists the final assistant message', async () => {
    const provider = {
      async generateExplanation() {
        return {
          answer: 'Answer',
          simplified: 'Simple answer',
          relatedConcepts: ['Concept 1'],
          commonMistakes: ['Mistake 1'],
          similarQuestions: ['Question 1'],
        }
      },
      async *streamResponse() {
        yield { type: 'delta', content: 'Hello ' }
        yield { type: 'delta', content: 'world' }
        yield {
          type: 'done',
          finishReason: 'stop',
          usage: { promptTokens: 2, completionTokens: 3, totalTokens: 5 },
          model: 'mock',
          metadata: { provider: 'mock' },
        }
      },
    }

    const service = new AIService(provider as any)
    const chunks: any[] = []

    for await (const chunk of service.streamChat({ prompt: 'Explain streaming' }, 'user-1')) {
      chunks.push(chunk)
    }

    const doneChunk = chunks.find((chunk) => chunk.type === 'done')
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toMatchObject({ type: 'delta', content: 'Hello ' })
    expect(chunks[1]).toMatchObject({ type: 'delta', content: 'world' })
    expect(doneChunk).toMatchObject({ type: 'done', finishReason: 'stop', model: 'mock' })
    expect(doneChunk?.usage).toEqual({ promptTokens: 2, completionTokens: 3, totalTokens: 5 })

    const conversationId = doneChunk?.conversationId
    expect(conversationId).toBeTruthy()
    if (conversationId) {
      createdConversationIds.push(conversationId)
      const conversation = await conversationService.getConversation(conversationId)
      expect(conversation?.messages).toHaveLength(1)
      expect(conversation?.messages[0].content).toBe('Hello world')
      expect(conversation?.messages[0].usage).toEqual({ promptTokens: 2, completionTokens: 3, totalTokens: 5 })
      expect(conversation?.messages[0].metadata).toEqual({ provider: 'mock' })
    }
  })

  it('falls back to non-streaming providers and yields a full delta followed by done', async () => {
    const service = new AIService(new NonStreamingProvider() as any)
    const chunks: any[] = []

    for await (const chunk of service.streamChat({ prompt: 'Fallback test' }, 'user-2')) {
      chunks.push(chunk)
    }

    expect(chunks[0]).toMatchObject({ type: 'delta' })
    expect(chunks[0].content).toContain('fallback response for Fallback test')
    expect(chunks[1]).toMatchObject({ type: 'done', finishReason: 'stop', model: 'fallback' })
    expect(chunks[1]?.usage).toEqual({ promptTokens: 1, completionTokens: 2, totalTokens: 3 })

    const conversationId = chunks[1]?.conversationId
    expect(conversationId).toBeTruthy()
    if (conversationId) {
      createdConversationIds.push(conversationId)
      const conversation = await conversationService.getConversation(conversationId)
      expect(conversation?.messages[0].content).toContain('fallback response for Fallback test')
    }
  })

  it('propagates provider error chunks without persisting assistant content', async () => {
    const provider = {
      async generateExplanation() {
        return {
          answer: 'Answer',
          simplified: 'Simple answer',
          relatedConcepts: ['Concept 1'],
          commonMistakes: ['Mistake 1'],
          similarQuestions: ['Question 1'],
        }
      },
      async *streamResponse() {
        yield { type: 'error', error: 'Provider error occurred' }
      },
    }

    const service = new AIService(provider as any)
    const chunks: any[] = []

    for await (const chunk of service.streamChat({ prompt: 'Error path' }, 'user-3')) {
      chunks.push(chunk)
    }

    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toMatchObject({ type: 'error', error: 'Provider error occurred' })
    const conversationId = chunks[0]?.conversationId
    expect(conversationId).toBeTruthy()
    if (conversationId) {
      createdConversationIds.push(conversationId)
      const conversation = await conversationService.getConversation(conversationId)
      expect(conversation?.messages).toHaveLength(0)
    }
  })

  it('handles provider aborts gracefully and returns an error chunk', async () => {
    const abortController = new AbortController()
    const provider = {
      async generateExplanation() {
        return {
          answer: 'Answer',
          simplified: 'Simple answer',
          relatedConcepts: ['Concept 1'],
          commonMistakes: ['Mistake 1'],
          similarQuestions: ['Question 1'],
        }
      },
      async *streamResponse(_context: AIRequestContext, options?: { signal?: AbortSignal }) {
        if (options?.signal?.aborted) {
          throw new Error('Provider aborted')
        }
        await new Promise<void>((_, reject) => {
          options?.signal?.addEventListener(
            'abort',
            () => reject(new Error('Provider aborted')),
            { once: true }
          )
        })
      },
    }

    const service = new AIService(provider as any)
    const chunks: any[] = []
    const stream = service.streamChat({ prompt: 'Abort test' }, 'user-4', { signal: abortController.signal })

    const pump = (async () => {
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
    })()

    abortController.abort()
    await pump

    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toMatchObject({ type: 'error', error: 'Error: Provider aborted' })

    const conversationId = chunks[0]?.conversationId
    expect(conversationId).toBeTruthy()
    if (conversationId) {
      createdConversationIds.push(conversationId)
      const conversation = await conversationService.getConversation(conversationId)
      expect(conversation?.messages).toHaveLength(0)
    }
  })
})
