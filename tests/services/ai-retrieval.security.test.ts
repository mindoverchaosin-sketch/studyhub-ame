import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
})

describe('Student AI retrieval publication guard', () => {
  it('excludes draft lessons and questions from id-based retrieval', async () => {
    const publishedLesson = { id: 'lesson-ok', title: 'Published Lesson', description: 'P', moduleId: 'm-1', status: 'PUBLISHED', updatedAt: new Date().toISOString(), metadata: {} } as any
    const draftLesson = { id: 'lesson-draft', title: 'Draft Lesson', description: 'D', moduleId: 'm-1', status: 'DRAFT', updatedAt: new Date().toISOString(), metadata: {} } as any
    const archivedQuestion = { id: 'question-archived', question: 'Archived question', explanation: 'A', status: 'ARCHIVED', createdAt: new Date().toISOString() } as any

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({
      createVectorStore: () => ({ search: vi.fn(async () => []) }),
    }))
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({
      createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2] }),
    }))
    vi.doMock('@/server/repositories/lesson.repository', () => ({
      lessonRepository: {
        list: vi.fn(async (params: any) => (params.status === 'PUBLISHED' ? [publishedLesson] : [])),
        findById: vi.fn(async (id: string) => (id === 'lesson-draft' ? draftLesson : publishedLesson)),
      },
    }))
    vi.doMock('@/server/repositories/question.repository', () => ({
      questionRepository: {
        findForAdmin: vi.fn(async (params: any) => (params.status === 'PUBLISHED' ? [] : [])),
        findById: vi.fn(async (id: string) => (id === 'question-archived' ? archivedQuestion : null)),
      },
    }))
    vi.doMock('@/server/repositories/module.repository', () => ({
      moduleRepository: { getModuleDetail: vi.fn(async () => null) },
    }))

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service')

    const context = await retrievalV2Service.buildRetrievalContext({
      lessonId: 'lesson-draft',
      questionId: 'question-archived',
      query: 'draft',
    })

    const sourceIds = context.retrievedChunks.map((chunk: any) => chunk.sourceId)
    expect(sourceIds).not.toContain('lesson-draft')
    expect(sourceIds).not.toContain('question-archived')
  })

  it('includes only published content for id lookups', async () => {
    const publishedLesson = { id: 'lesson-ok', title: 'Published Lesson', description: 'P', moduleId: 'm-1', status: 'PUBLISHED', updatedAt: new Date().toISOString(), metadata: {} } as any
    const publishedQuestion = { id: 'question-ok', question: 'Published question', explanation: 'Because', status: 'PUBLISHED', createdAt: new Date().toISOString() } as any

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({
      createVectorStore: () => ({ search: vi.fn(async () => []) }),
    }))
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({
      createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2] }),
    }))
    vi.doMock('@/server/repositories/lesson.repository', () => ({
      lessonRepository: {
        list: vi.fn(async () => []),
        findById: vi.fn(async () => publishedLesson),
      },
    }))
    vi.doMock('@/server/repositories/question.repository', () => ({
      questionRepository: {
        findForAdmin: vi.fn(async () => []),
        findById: vi.fn(async () => publishedQuestion),
      },
    }))
    vi.doMock('@/server/repositories/module.repository', () => ({
      moduleRepository: { getModuleDetail: vi.fn(async () => null) },
    }))

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service')

    const context = await retrievalV2Service.buildRetrievalContext({
      lessonId: 'lesson-ok',
      questionId: 'question-ok',
      query: 'corrosion',
    })

    const sourceIds = context.retrievedChunks.map((chunk: any) => chunk.sourceId)
    expect(sourceIds).toContain('lesson-ok')
    expect(sourceIds).toContain('question-ok')
  })

  it('forces PUBLISHED status on keyword searches against lesson and question repositories', async () => {
    const listSpy = vi.fn(async () => [])
    const findForAdminSpy = vi.fn(async () => [])

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({
      createVectorStore: () => ({ search: vi.fn(async () => []) }),
    }))
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({
      createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2] }),
    }))
    vi.doMock('@/server/repositories/lesson.repository', () => ({
      lessonRepository: { list: listSpy, findById: vi.fn(async () => null) },
    }))
    vi.doMock('@/server/repositories/question.repository', () => ({
      questionRepository: { findForAdmin: findForAdminSpy, findById: vi.fn(async () => null) },
    }))
    vi.doMock('@/server/repositories/module.repository', () => ({
      moduleRepository: { getModuleDetail: vi.fn(async () => null) },
    }))

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service')

    await retrievalV2Service.buildRetrievalContext({ query: 'hydraulic systems' })

    expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }))
    expect(findForAdminSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'PUBLISHED' }))
  })

  it('drops vector documents that are not explicitly marked PUBLISHED', async () => {
    const documents = [
      {
        chunkId: 'chunk-unpublished',
        sourceId: 'lesson-secret',
        sourceType: 'lesson',
        title: 'Secret draft',
        text: 'Internal draft notes',
        metadata: { status: 'DRAFT' },
      },
      {
        chunkId: 'chunk-published',
        sourceId: 'lesson-public',
        sourceType: 'lesson',
        title: 'Public lesson',
        text: 'Everyone can see this',
        metadata: { status: 'PUBLISHED' },
      },
    ]

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({
      createVectorStore: () => ({
        search: vi.fn(async (_embedding: number[], topK: number) =>
          documents.map((document) => ({ document, similarity: 0.9 })).slice(0, topK),
        ),
      }),
    }))
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({
      createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2] }),
    }))
    vi.doMock('@/server/repositories/lesson.repository', () => ({
      lessonRepository: { list: vi.fn(async () => []), findById: vi.fn(async () => null) },
    }))
    vi.doMock('@/server/repositories/question.repository', () => ({
      questionRepository: { findForAdmin: vi.fn(async () => []), findById: vi.fn(async () => null) },
    }))
    vi.doMock('@/server/repositories/module.repository', () => ({
      moduleRepository: { getModuleDetail: vi.fn(async () => null) },
    }))

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service')

    const context = await retrievalV2Service.buildRetrievalContext({ query: 'anything' })
    const sourceIds = context.retrievedChunks.map((chunk: any) => chunk.sourceId)

    expect(sourceIds).not.toContain('lesson-secret')
    expect(sourceIds).toContain('lesson-public')
  })
})
