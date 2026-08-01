import type { EmbeddingProvider } from '@/types/ai';

export class MockEmbeddingProvider implements EmbeddingProvider {
  async createEmbedding(text: string): Promise<number[]> {
    const normalized = text.trim().toLowerCase();
    const embedding = Array.from({ length: 16 }, (_, index) => {
      const char = normalized.charCodeAt(index % normalized.length) || 0;
      return ((char % 97) + index) / 16;
    });
    return embedding;
  }
}
