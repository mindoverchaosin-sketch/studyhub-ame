import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('Retrieval metrics', () => {
  it('populates metrics even when no results are found', async () => {
    vi.doMock('@/services/ai/VectorStoreFactory', () => ({ createVectorStore: () => ({ search: vi.fn().mockResolvedValue([]) }) }));
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({ createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1] }) }));
    vi.doMock('@/server/repositories/lesson.repository', () => ({ lessonRepository: { list: vi.fn().mockResolvedValue([]), findById: vi.fn().mockResolvedValue(null) } }));
    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: { findForAdmin: vi.fn().mockResolvedValue([]), findById: vi.fn().mockResolvedValue(null) } }));
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { getModuleDetail: vi.fn().mockResolvedValue(null) } }));

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service');
    const { retrievalMetricsCollector } = await import('@/services/ai/RetrievalMetrics');

    const ctx = await retrievalV2Service.buildRetrievalContext({ query: 'nothing will match' });

    const metrics = retrievalMetricsCollector.finish();
    expect(metrics.chunksSearched).toBeGreaterThanOrEqual(0);
    expect(metrics.totalRetrievalTimeMs).toBeGreaterThanOrEqual(0);
    expect(metrics.keywordHits).toBeGreaterThanOrEqual(0);
    expect(metrics.vectorHits).toBeGreaterThanOrEqual(0);
  });
});
