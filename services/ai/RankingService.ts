import type { RankedRetrievalResult, RetrievalCandidate } from '@/types/ai';

export interface RankingOptions {
  keywordWeight?: number;
  semanticWeight?: number;
  metadataWeight?: number;
  recencyWeight?: number;
  lessonPriorityWeight?: number;
  moduleRelevanceWeight?: number;
}

export class RankingService {
  rankResults(results: RetrievalCandidate[], options: RankingOptions = {}): RankedRetrievalResult[] {
    const {
      keywordWeight = 1,
      semanticWeight = 1,
      metadataWeight = 0.5,
      recencyWeight = 0.25,
      lessonPriorityWeight = 0.5,
      moduleRelevanceWeight = 0.5,
    } = options;

    return results
      .map((candidate) => {
        const keywordScore = candidate.keywordScore ?? 0;
        const semanticScore = candidate.semanticScore ?? 0;
        const metadataScore = candidate.metadataScore ?? 0;
        const recencyScore = candidate.recencyScore ?? 0;
        const lessonPriority = candidate.lessonPriority ?? 0;
        const moduleRelevance = candidate.moduleRelevance ?? 0;

        const score =
          keywordWeight * keywordScore +
          semanticWeight * semanticScore +
          metadataWeight * metadataScore +
          recencyWeight * recencyScore +
          lessonPriorityWeight * lessonPriority +
          moduleRelevanceWeight * moduleRelevance;

        return {
          ...candidate,
          rankingScore: score,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore);
  }
}

export const rankingService = new RankingService();
