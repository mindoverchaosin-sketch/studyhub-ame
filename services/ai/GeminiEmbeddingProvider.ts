import type { EmbeddingProvider } from '@/types/ai';

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  async createEmbedding(text: string): Promise<number[]> {
    const words = text.trim().split(/\s+/).slice(0, 16);
    return words.map((word, index) => (word.charCodeAt(0) || 0) / (index + 16));
  }
}
