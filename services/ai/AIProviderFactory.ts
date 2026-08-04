import type { AIProvider } from '@/types/ai';
import { AnthropicProvider } from '@/services/ai/AnthropicProvider';
import { GeminiProvider } from '@/services/ai/GeminiProvider';
import { MockAIProvider } from '@/services/ai/MockAIProvider';
import { OpenAIProvider } from '@/services/ai/OpenAIProvider';

import { env } from '@/lib/env'

export function createAIProvider(): AIProvider {
  const providerName = (process.env.AI_PROVIDER ?? env.AI_PROVIDER ?? 'mock').toLowerCase();
  switch (providerName) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'gemini':
    case 'google-gemini':
      return new GeminiProvider();
    default:
      return new MockAIProvider();
  }
}
