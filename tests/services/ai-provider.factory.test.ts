import { describe, expect, it } from 'vitest';
import * as factory from '@/services/ai/AIProviderFactory';
import { createAIProvider } from '@/services/ai/AIProviderFactory';
import { MockAIProvider } from '@/services/ai/MockAIProvider';
import { OpenAIProvider } from '@/services/ai/OpenAIProvider';
import { AnthropicProvider } from '@/services/ai/AnthropicProvider';
import { GeminiProvider } from '@/services/ai/GeminiProvider';

describe('AI provider factory', () => {
  const originalEnv = process.env.AI_PROVIDER;

  afterEach(() => {
    process.env.AI_PROVIDER = originalEnv;
  });

  it('returns MockAIProvider by default', () => {
    delete process.env.AI_PROVIDER;
    const provider = createAIProvider();
    expect(provider).toBeInstanceOf(MockAIProvider);
  });

  it('returns OpenAIProvider when configured', () => {
    process.env.AI_PROVIDER = 'openai';
    const provider = createAIProvider();
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('returns AnthropicProvider when configured', () => {
    process.env.AI_PROVIDER = 'anthropic';
    const provider = createAIProvider();
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it('returns GeminiProvider when configured', () => {
    process.env.AI_PROVIDER = 'gemini';
    const provider = createAIProvider();
    expect(provider).toBeInstanceOf(GeminiProvider);
  });
});
