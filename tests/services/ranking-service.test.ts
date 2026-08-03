import { describe, expect, it } from 'vitest';
import type { RetrievalCandidate } from '@/types/ai';
import { RankingService } from '@/services/ai/RankingService';

const stubCandidates: RetrievalCandidate[] = [
  {
    chunk: {
      id: 'chunk-a',
      sourceId: 'lesson-a',
      sourceType: 'lesson',
      title: 'Lesson A',
      text: 'A is about algebra.',
      metadata: { difficulty: 'Medium' },
    },
    keywordScore: 0.75,
    semanticScore: 0.85,
    metadataScore: 0.3,
    recencyScore: 0.1,
    lessonPriority: 0.5,
    moduleRelevance: 0.2,
    citation: {
      sourceType: 'lesson',
      sourceId: 'lesson-a',
      title: 'Lesson A',
      chunkId: 'chunk-a',
      relevanceScore: 0.7,
    },
  },
  {
    chunk: {
      id: 'chunk-b',
      sourceId: 'lesson-b',
      sourceType: 'lesson',
      title: 'Lesson B',
      text: 'B is about biology and cells.',
      metadata: { difficulty: 'Easy' },
    },
    keywordScore: 0.4,
    semanticScore: 0.9,
    metadataScore: 0.1,
    recencyScore: 0.05,
    lessonPriority: 0.2,
    moduleRelevance: 0.1,
    citation: {
      sourceType: 'lesson',
      sourceId: 'lesson-b',
      title: 'Lesson B',
      chunkId: 'chunk-b',
      relevanceScore: 0.5,
    },
  },
];

describe('RankingService', () => {
  it('ranks results by weighted semantic and keyword scores', () => {
    const ranked = new RankingService().rankResults(stubCandidates);
    expect(Array.isArray(ranked)).toBe(true);
    expect(ranked[0].chunk.id).toBe('chunk-a');
  });

  it('calculates rankingScore on each result', () => {
    const ranked = new RankingService().rankResults(stubCandidates);
    expect(ranked[0].rankingScore!).toBeGreaterThanOrEqual(ranked[1].rankingScore!);
    expect(typeof ranked[0].rankingScore).toBe('number');
  });
});
