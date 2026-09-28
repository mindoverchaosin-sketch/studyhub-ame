import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Question } from '@prisma/client';

beforeEach(() => {
  vi.resetModules();
});

describe('Retrieval regression tests', () => {
  it('keyword retrieval still returns lessons and questions and prompt builder compatibility', async () => {
    const now = new Date();
    const lesson = { id: 'lr-1', slug: 'kw-lesson', title: 'KW Lesson', description: 'D', moduleId: 'm-1', durationMinutes: 0, displayOrder: 0, status: 'PUBLISHED', publishedAt: null, metadata: null, createdAt: now, updatedAt: now, deletedAt: null };
    const question: Question = { id: 'q-kw-1', questionBankId: 'bank-1', prompt: 'Why?', questionType: 'MULTIPLE_CHOICE', options: ['A', 'B'], correctOptionIndex: 0, explanation: 'Because', difficulty: 'BEGINNER', status: 'PUBLISHED', metadata: null, createdAt: now, updatedAt: now, deletedAt: null };

    vi.doMock('@/services/ai/VectorStoreFactory', () => ({ createVectorStore: () => ({ search: vi.fn().mockResolvedValue([]) }) }));
    vi.doMock('@/services/ai/EmbeddingProviderFactory', () => ({ createEmbeddingProvider: () => ({ createEmbedding: async () => [0.1] }) }));

    vi.doMock('@/server/repositories/lesson.repository', () => ({ lessonRepository: { list: vi.fn().mockResolvedValue([lesson]) } }));
    vi.doMock('@/server/repositories/question.repository', () => ({ questionRepository: { findForAdmin: vi.fn().mockResolvedValue([question]) } }));
    vi.doMock('@/server/repositories/module.repository', () => ({ moduleRepository: { getModuleDetail: vi.fn().mockResolvedValue(null) } }));

    const { retrievalV2Service } = await import('@/server/services/ai/retrieval-v2.service');

    const ctx = await retrievalV2Service.buildRetrievalContext({ query: 'KW' });
    expect(ctx.retrievedSources.some((source) => source.type === 'lesson')).toBe(true);
    expect(ctx.retrievedSources.some((source) => source.type === 'question')).toBe(true);
  });
});
