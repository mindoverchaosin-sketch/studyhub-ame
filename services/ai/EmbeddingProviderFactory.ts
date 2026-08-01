import type { EmbeddingProvider } from '@/types/ai';
import { GeminiEmbeddingProvider } from '@/services/ai/GeminiEmbeddingProvider';
import { MockEmbeddingProvider } from '@/services/ai/MockEmbeddingProvider';
import { OpenAIEmbeddingProvider } from '@/services/ai/OpenAIEmbeddingProvider';

export function createEmbeddingProvider(): EmbeddingProvider {
  const providerName = process.env.AI_PROVIDER?.toLowerCase() ?? 'mock';

  switch (providerName) {
    case 'openai':
      return new OpenAIEmbeddingProvider();
    case 'anthropic':
      return new GeminiEmbeddingProvider();
    case 'gemini':
    case 'google-gemini':
      return new GeminiEmbeddingProvider();
    default:
      return new MockEmbeddingProvider();
  }
}
