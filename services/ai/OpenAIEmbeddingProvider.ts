import type { EmbeddingProvider } from '@/types/ai';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  async createEmbedding(text: string): Promise<number[]> {
    return text
      .trim()
      .split(/\s+/)
      .slice(0, 16)
      .map((word, index) => (word.length + index) / 16);
  }
}
