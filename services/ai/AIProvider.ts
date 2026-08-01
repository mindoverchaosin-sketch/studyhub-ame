import type { AIExplanation, AIMessage, AIProvider, AIRequestContext, Question } from "@/types/ai";

export abstract class BaseAIProvider implements AIProvider {
  readonly capabilities = {
    streaming: false,
    vision: false,
    functionCalling: false,
    jsonOutput: false,
    embeddings: false,
  };

  abstract generateResponse(context: AIRequestContext): Promise<AIMessage>;
  abstract generateExplanation(question: Question): Promise<AIExplanation>;
  streamResponse?(context: AIRequestContext, options?: { timeoutMs?: number; attempt?: number; signal?: AbortSignal }): AsyncGenerator<import("@/types/ai").AIStreamChunk, void, void>;
}

export function createPlaceholderMessage(content: string): AIMessage {
  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}
