import type { AIContentChunk, AIContentSourceType } from '@/types/ai';

export interface ChunkOptions {
  maxWords?: number;
  overlapWords?: number;
}

export class ChunkingService {
  chunkText(
    sourceId: string,
    sourceType: AIContentSourceType,
    title: string,
    text: string,
    metadata: Record<string, unknown> = {},
    options: ChunkOptions = {},
  ): AIContentChunk[] {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return [];
    }

    const maxWords = options.maxWords ?? 80;
    const overlapWords = Math.min(options.overlapWords ?? 16, maxWords - 1);
    const words = normalizedText.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return [];
    }

    const chunks: AIContentChunk[] = [];
    let start = 0;
    let index = 0;

    while (start < words.length) {
      const slice = words.slice(start, start + maxWords);
      const chunkText = slice.join(' ');
      chunks.push({
        id: `${sourceId}-${index + 1}`,
        sourceId,
        sourceType,
        title,
        text: chunkText,
        metadata: {
          ...metadata,
          sourceTitle: title,
          sourceType,
        },
      });

      index += 1;
      start += maxWords - overlapWords;
      if (slice.length < maxWords) break;
    }

    return chunks;
  }

  computeRelevance(text: string, query: string): number {
    const normalizedText = text.toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return terms.reduce((score, term) => (normalizedText.includes(term) ? score + 1 : score), 0);
  }

  rankChunks(chunks: AIContentChunk[], query: string): AIContentChunk[] {
    if (!query?.trim()) {
      return chunks;
    }

    return [...chunks]
      .map((chunk) => ({
        ...chunk,
        metadata: {
          ...chunk.metadata,
          relevance: this.computeRelevance(chunk.text, query),
        },
      }))
      .sort((a, b) => {
        const relevanceA = Number(a.metadata.relevance ?? 0);
        const relevanceB = Number(b.metadata.relevance ?? 0);
        return relevanceB - relevanceA;
      });
  }
}

export const chunkingService = new ChunkingService();
