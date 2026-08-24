import { beforeEach, describe, expect, it, vi } from 'vitest'

const conversationMocks = vi.hoisted(() => ({
  getConversation: vi.fn(),
  createConversation: vi.fn(),
  addMessage: vi.fn(async () => null),
}))

const canUseAITutorMock = vi.hoisted(() => vi.fn())

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canUseAITutor: canUseAITutorMock,
  },
}))

vi.mock('@/server/services/ai/conversation.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/server/services/ai/conversation.service')>()
  return {
    ...actual,
    conversationService: conversationMocks,
  }
})

vi.mock('@/server/services/ai/retrieval.service', () => ({
  retrievalService: { buildRetrievalContext: vi.fn(async () => ({ retrievalQuery: '', sourceSummary: '', retrievedSources: [], retrievedChunks: [] })) },
}))

vi.mock('@/server/services/ai/personalization.service', () => ({
  personalizationService: { buildLearnerProfile: vi.fn(async () => undefined) },
}))

vi.mock('@/services/ai/AIProviderFactory', () => ({
  createAIProvider: () => ({
    async generateResponse() {
      return {
        id: 'msg-assistant',
        role: 'assistant',
        content: 'assistant reply',
        createdAt: new Date().toISOString(),
        finishReason: 'stop',
        model: 'mock',
        metadata: {},
      }
    },
  }),
}))

import { AIService } from '@/server/services/ai/ai-service'
import { ConversationService } from '@/server/services/ai/conversation.service'
import type { AIMessage } from '@/types/ai'

function makeRepository() {
  const conversations = new Map<string, any>()
  const repository = {
    createConversation: vi.fn(async (_title: string, userId?: string) => {
      const conversation = {
        id: `conv-${conversations.size + 1}`,
        title: _title,
        userId: userId ?? null,
        messages: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      }
      conversations.set(conversation.id, conversation)
      return conversation
    }),
    findConversation: vi.fn(async (id: string) => conversations.get(id) ?? null),
    findConversationForUser: vi.fn(async (id: string, userId: string) => {
      const conversation = conversations.get(id)
      return conversation && conversation.userId === userId ? conversation : null
    }),
    ownsConversation: vi.fn(async (id: string, userId: string) => conversations.get(id)?.userId === userId),
    addMessage: vi.fn(async (id: string, message: AIMessage) => {
      const conversation = conversations.get(id)
      if (!conversation) return null
      conversation.messages.push(message)
      return conversation
    }),
    renameConversation: vi.fn(async (id: string, title: string) => {
      const conversation = conversations.get(id)
      if (!conversation) return null
      conversation.title = title
      return conversation
    }),
    deleteConversation: vi.fn(async (id: string) => conversations.delete(id)),
  }
  return { repository, conversations }
}

describe('AI conversation ownership security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    canUseAITutorMock.mockResolvedValue({ allowed: true, requiredFeature: 'aiTools' })
  })

  it('user A cannot read user B conversation through the durable path', async () => {
    const { repository } = makeRepository()
    const service = new ConversationService(repository as never)

    const created = await service.createConversation('Private session', 'user-A')

    const foreignView = await service.getConversation(created.id, 'user-B')
    expect(foreignView).toBeNull()

    const ownerView = await service.getConversation(created.id, 'user-A')
    expect(ownerView?.id).toBe(created.id)
  })

  it('user A cannot modify user B conversation', async () => {
    const { repository } = makeRepository()
    const service = new ConversationService(repository as never)
    const created = await service.createConversation('Private session', 'user-A')
    const message: AIMessage = { id: 'm-1', role: 'user', content: 'inject', createdAt: new Date().toISOString() }

    await expect(service.addMessage(created.id, message, 'user-B')).resolves.toBeNull()
    await expect(service.renameConversation(created.id, 'hacked', 'user-B')).resolves.toBeNull()
    await expect(service.deleteConversation(created.id, 'user-B')).resolves.toBe(false)

    expect(repository.addMessage).not.toHaveBeenCalled()
    expect(repository.renameConversation).not.toHaveBeenCalled()
    expect(repository.deleteConversation).not.toHaveBeenCalled()

    // Owner can still write
    await expect(service.addMessage(created.id, message, 'user-A')).resolves.toMatchObject({ id: created.id })
  })

  it('enforces ownership on the in-memory fallback path', async () => {
    const service = new ConversationService()
    const created = await service.createConversation('Memory session', 'user-A')

    // In-memory fallback resolves synchronously.
    expect(service.getConversation(created.id, 'user-B')).toBeNull()
    expect(
      service.addMessage(created.id, { id: 'm-2', role: 'user', content: 'hi', createdAt: new Date().toISOString() }, 'user-B'),
    ).resolves.toBeNull()
    await expect(service.deleteConversation(created.id, 'user-B')).resolves.toBe(false)

    const ownerConversation = await service.getConversation(created.id, 'user-A')
    expect(ownerConversation?.userId).toBe('user-A')
  })

  it('handleChat rejects a foreign conversationId without leaking existence', async () => {
    conversationMocks.getConversation.mockResolvedValue(null)
    conversationMocks.createConversation.mockResolvedValue({
      id: 'conv-new',
      title: 'Tutor session',
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      userId: 'user-B',
    })
    conversationMocks.addMessage.mockResolvedValue(null)

    const service = new AIService()

    // Foreign conversation: ownership check resolves null -> indistinguishable from missing.
    await expect(
      service.handleChat({ prompt: 'hello', conversationId: 'conv-of-user-A' }, 'user-B'),
    ).rejects.toMatchObject({ code: 'CONVERSATION_NOT_FOUND', status: 404 })

    expect(conversationMocks.getConversation).toHaveBeenCalledWith('conv-of-user-A', 'user-B')

    // Own conversation passes and the assistant message is persisted with the owner id.
    conversationMocks.getConversation.mockResolvedValue({
      id: 'conv-owned',
      title: 'Tutor session',
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      userId: 'user-B',
    })

    const response = await service.handleChat({ prompt: 'hello', conversationId: 'conv-owned' }, 'user-B')
    expect(response.success).toBe(true)
    expect(response.conversationId).toBe('conv-owned')
    expect(conversationMocks.addMessage).toHaveBeenCalledWith('conv-owned', expect.objectContaining({ role: 'assistant' }), 'user-B')
  })
})
