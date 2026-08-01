import type { AIStreamChunk } from '@/types/ai';

export interface StreamingOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

export function createTimeoutSignal(timeoutMs?: number, parentSignal?: AbortSignal): AbortSignal | undefined {
  if (!timeoutMs && !parentSignal) return undefined;

  const controller = new AbortController();

  const timeout = timeoutMs
    ? (globalThis.setTimeout(() => controller.abort(), timeoutMs) as unknown as number)
    : undefined;

  if (parentSignal) {
    if (parentSignal.aborted) controller.abort();
    parentSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  if (timeout !== undefined) {
    controller.signal.addEventListener('abort', () => globalThis.clearTimeout(timeout));
  }

  return controller.signal;
}

export function createStreamChunk(content: string): AIStreamChunk {
  return { type: 'delta', content };
}

export function createCompletionChunk(
  finishReason?: string,
  usage?: AIStreamChunk['usage'],
  model?: string,
  metadata?: Record<string, unknown>
): AIStreamChunk {
  return { type: 'done', finishReason, usage, model, metadata };
}

export function createErrorChunk(error: string): AIStreamChunk {
  return { type: 'error', error };
}
