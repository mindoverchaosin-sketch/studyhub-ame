import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { retrievalService } from '@/server/services/ai/retrieval.service';
import { lessonRepository } from '@/server/repositories/lesson.repository';
import { moduleRepository } from '@/server/repositories/module.repository';
import { questionRepository } from '@/server/repositories/question.repository';

describe('RetrievalService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a retrieval context from lesson and question inputs', async () => {
    vi.spyOn(questionRepository, 'findById').mockResolvedValue({
      id: 'q1',
      question: 'What causes corrosion?',
      explanation: 'Because of oxidation.',
      topic: 'Corrosion',
      difficulty: 'Hard',
      standard: 'DGCA',
      status: 'Unanswered',
      module: 'Corrosion module',
      isBookmarked: false,
      recommended: false,
    } as any);

    vi.spyOn(lessonRepository, 'findById').mockResolvedValue({
      id: 'l1',
      title: 'Corrosion basics',
      description: 'Corrosion is the degradation of metal caused by chemical reactions.',
      moduleId: 'm1',
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      slug: 'corrosion-basics',
    } as any);

    vi.spyOn(moduleRepository, 'getModuleDetail').mockResolvedValue(null as any);

    const context = await retrievalService.buildRetrievalContext({
      lessonId: 'l1',
      questionId: 'q1',
      query: 'corrosion',
    });

    expect(context.retrievalQuery).toBe('corrosion');
    expect(context.retrievedSources.length).toBeGreaterThanOrEqual(2);
    expect(context.retrievedChunks.length).toBeGreaterThan(0);
    expect(context.sourceSummary).toContain('QUESTION - What causes corrosion?');
  });
});
