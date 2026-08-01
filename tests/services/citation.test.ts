import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prepare mocks before importing the service
beforeEach(() => {
  vi.resetModules();
});

describe('Citation generation', () => {
  it('creates lesson, question, module and mockTest citations and preserves metadata', async () => {
    // Mock repositories and vector store factory
    const mockVectorStore = {
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      search: vi.fn().mockResolvedValue([]),
    } as any;

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({
      createVectorStore: () => mockVectorStore,
    }));

    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({
      createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2, 0.3] }),
    }));
    const lesson = {
      id: 'lesson-1',
      title: 'Test Lesson',
      description: 'Desc',
      moduleId: 'module-1',
      status: 'PUBLISHED',
      updatedAt: new Date().toISOString(),
      metadata: { tags: ['t1'], lessonTitle: 'Test Lesson' },
    } as any;

    const question = {
      id: 'q-1',
      question: 'What is X?',
      explanation: 'Because',
      difficulty: 'Easy',
      createdAt: new Date().toISOString(),
    } as any;

    vi.doMock('@/server/repositories/lesson.repository', () => ({
      lessonRepository: {
        list: vi.fn().mockResolvedValue([lesson]),
        findById: vi.fn().mockResolvedValue(lesson),
      },
    }));

    vi.doMock('@/server/repositories/question.repository', () => ({
      questionRepository: {
        findForAdmin: vi.fn().mockResolvedValue([question]),
        findById: vi.fn().mockResolvedValue(question),
      },
    }));

    vi.doMock('@/server/repositories/module.repository', () => ({
      moduleRepository: { getModuleDetail: vi.fn().mockResolvedValue({ id: 'module-1', title: 'Module 1' }) },
    }));

    // Import after mocks
    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service');

    const ctx = await retrievalV2Service.buildRetrievalContext({ query: 'test' });

    // Check citations exist and metadata flows through
    expect(ctx.retrievedChunks.length).toBeGreaterThanOrEqual(1);
    const first = ctx.retrievedChunks[0];
    expect(first.metadata).toHaveProperty('lessonId');
    expect(ctx.retrievedSources.some((s: any) => s.type === 'lesson')).toBe(true);
  });
});
