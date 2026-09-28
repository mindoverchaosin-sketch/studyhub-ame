import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Lesson, Question } from '@prisma/client';
import { retrievalService } from '@/server/services/ai/retrieval.service';
import { lessonRepository } from '@/server/repositories/lesson.repository';
import { moduleRepository } from '@/server/repositories/module.repository';
import { questionRepository } from '@/server/repositories/question.repository';

describe('RetrievalService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds a retrieval context from lesson and question inputs', async () => {
    const now = new Date();
    const question: Question = {
      id: 'q1', questionBankId: 'bank-1', prompt: 'What causes corrosion?', questionType: 'MULTIPLE_CHOICE', options: ['A', 'B'],
      correctOptionIndex: 0, explanation: 'Because of oxidation.', difficulty: 'ADVANCED', status: 'PUBLISHED', metadata: null,
      createdAt: now, updatedAt: now, deletedAt: null,
    };
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(question);

    const lesson: Lesson = {
      id: 'l1', moduleId: 'm1', slug: 'corrosion-basics', title: 'Corrosion basics',
      description: 'Corrosion is the degradation of metal caused by chemical reactions.', durationMinutes: 0, displayOrder: 0,
      status: 'PUBLISHED', publishedAt: now, metadata: null, createdAt: now, updatedAt: now, deletedAt: null,
    };
    vi.spyOn(lessonRepository, 'findById').mockResolvedValue(lesson);

    vi.spyOn(moduleRepository, 'getModuleDetail').mockResolvedValue(null);

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
