import { describe, expect, it } from 'vitest';
import { MockEmbeddingProvider } from '@/services/ai/MockEmbeddingProvider';
import { OpenAIEmbeddingProvider } from '@/services/ai/OpenAIEmbeddingProvider';
import { GeminiEmbeddingProvider } from '@/services/ai/GeminiEmbeddingProvider';

describe('Embedding Providers', () => {
  it('generates a stable mock embedding vector', async () => {
    const provider = new MockEmbeddingProvider();
    const embedding = await provider.createEmbedding('Test embedding');
    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding).toHaveLength(16);
  });

  it('returns a stubbed OpenAI-style embedding', async () => {
    const provider = new OpenAIEmbeddingProvider();
    const embedding = await provider.createEmbedding('OpenAI test');
    expect(embedding.length).toBeGreaterThan(0);
  });

  it('returns a stubbed Gemini-style embedding', async () => {
    const provider = new GeminiEmbeddingProvider();
    const embedding = await provider.createEmbedding('Gemini test');
    expect(embedding.length).toBeGreaterThan(0);
  });
});
