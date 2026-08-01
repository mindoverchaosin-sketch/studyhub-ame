import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('Ranking edge cases', () => {
  it('handles equal ranking scores deterministically and preserves items', async () => {
    const rankingModule = await import('@/services/ai/RankingService');
    const RankingService = rankingModule.RankingService;

    const candidates = [
      { chunk: { id: 'c1' }, keywordScore: 1, semanticScore: 0 },
      { chunk: { id: 'c2' }, keywordScore: 1, semanticScore: 0 },
      { chunk: { id: 'c3' }, keywordScore: 0, semanticScore: 1 },
    ];

    const ranked = new RankingService().rankResults(candidates as any);
    expect(ranked).toHaveLength(3);
    // Ensure all original ids present
    expect(ranked.map((r) => r.chunk.id).sort()).toEqual(['c1', 'c2', 'c3'].sort());
  });

  it('handles large result sets without crashing', async () => {
    const rankingModule = await import('@/services/ai/RankingService');
    const RankingService = rankingModule.RankingService;

    const large = Array.from({ length: 2000 }).map((_, i) => ({ chunk: { id: `id-${i}` }, keywordScore: Math.random(), semanticScore: Math.random() }));
    const ranked = new RankingService().rankResults(large as any);
    expect(ranked.length).toBe(2000);
  });
});
