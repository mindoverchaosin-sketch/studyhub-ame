import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('Retrieval regression tests', () => {
  it('keyword retrieval still returns lessons and questions and prompt builder compatibility', async () => {
    const lesson = { id: 'lr-1', title: 'KW Lesson', description: 'D', moduleId: null, status: 'PUBLISHED', updatedAt: new Date().toISOString() } as any;
    const question = { id: 'q-kw-1', question: 'Why?', explanation: 'Because', difficulty: 'Easy', createdAt: new Date().toISOString() } as any;

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({ createVectorStore: () => ({ search: vi.fn().mockResolvedValue([]) }) }));
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({ createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1] }) }));

    vi.doMock('@/server/repositories/lesson.repository', () => ({ lessonRepository: { list: vi.fn().mockResolvedValue([lesson]) } }));
    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: { findForAdmin: vi.fn().mockResolvedValue([question]) } }));
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { getModuleDetail: vi.fn().mockResolvedValue(null) } }));

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service');

    const ctx = await retrievalV2Service.buildRetrievalContext({ query: 'KW' });
    expect(ctx.retrievedSources.some((s: any) => s.type === 'lesson')).toBe(true);
    expect(ctx.retrievedSources.some((s: any) => s.type === 'question')).toBe(true);
  });
});
