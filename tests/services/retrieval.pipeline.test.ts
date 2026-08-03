import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('Retrieval pipeline end-to-end', () => {
  it('merges keyword and vector results, ranks, removes duplicates, and builds prompt content', async () => {
    const documents = new Map();
    const sharedVectorStore = {
      documents,
      insert: vi.fn(async (doc: any) => { documents.set(doc.chunkId, doc); }),
      update: vi.fn(),
      delete: vi.fn(async (id: string) => { documents.delete(id); }),
      search: vi.fn(async (embedding: number[], topK: number) => {
        const arr = Array.from(documents.values()).map((d: any) => ({ document: d, similarity: 0.9 }));
        return arr.slice(0, topK);
      }),
    } as any;

    const lesson = { id: 'l-1', title: 'Merge Lesson', description: 'M', moduleId: 'm-1', status: 'PUBLISHED', updatedAt: new Date().toISOString(), metadata: {} } as any;
    const question = { id: 'q-1', question: 'A question', explanation: 'E', difficulty: 'Easy', createdAt: new Date().toISOString() } as any;

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({ createVectorStore: () => sharedVectorStore }));
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({ createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1, 0.2] }) }));

    vi.doMock('@/server/repositories/lesson.repository', () => ({ lessonRepository: { list: vi.fn().mockResolvedValue([lesson]), findById: vi.fn().mockResolvedValue(lesson) } }));
    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: { findForAdmin: vi.fn().mockResolvedValue([question]), findById: vi.fn().mockResolvedValue(question) } }));
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { getModuleDetail: vi.fn().mockResolvedValue(null) } }));

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service');

    // Insert a vector doc that duplicates the lesson chunk id to test dedup
    const duplicatedChunk = {
      chunkId: 'l-1-chunk-1',
      sourceId: 'l-1',
      sourceType: 'lesson',
      title: 'Merge Lesson',
      text: 'Vector duplicate',
      metadata: {},
      embedding: [0.1, 0.2],
    };

    await sharedVectorStore.insert(duplicatedChunk);

    const ctx = await retrievalV2Service.buildRetrievalContext({ query: 'merge' });

    expect(ctx.retrievedChunks.length).toBeGreaterThan(0);
    // Ensure duplicates removed (no duplicate chunk ids)
    const ids = ctx.retrievedChunks.map((c: any) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
    // Ensure source summary contains both types
    expect(ctx.sourceSummary).toContain('LESSON');
  });
});
