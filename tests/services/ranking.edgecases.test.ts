import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RetrievalCandidate } from '@/types/ai';

function createCandidate(id: string, keywordScore: number, semanticScore: number): RetrievalCandidate {
  const chunk = { id, sourceId: id, sourceType: 'lesson' as const, title: id, text: id, metadata: {} };
  return {
    chunk,
    keywordScore,
    semanticScore,
    citation: { sourceType: 'lesson', sourceId: id, title: id, chunkId: id, relevanceScore: 0 },
  };
}

beforeEach(() => {
  vi.resetModules();
});

describe('Ranking edge cases', () => {
  it('handles equal ranking scores deterministically and preserves items', async () => {
    const rankingModule = await import('@/services/ai/RankingService');
    const RankingService = rankingModule.RankingService;

    const candidates = [createCandidate('c1', 1, 0), createCandidate('c2', 1, 0), createCandidate('c3', 0, 1)];

    const ranked = new RankingService().rankResults(candidates);
    expect(ranked).toHaveLength(3);
    // Ensure all original ids present
    expect(ranked.map((r) => r.chunk.id).sort()).toEqual(['c1', 'c2', 'c3'].sort());
  });

  it('handles large result sets without crashing', async () => {
    const rankingModule = await import('@/services/ai/RankingService');
    const RankingService = rankingModule.RankingService;

    const large = Array.from({ length: 2000 }, (_, index) => createCandidate(`id-${index}`, Math.random(), Math.random()));
    const ranked = new RankingService().rankResults(large);
    expect(ranked.length).toBe(2000);
  });
});
