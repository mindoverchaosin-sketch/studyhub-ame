import { BaseAIProvider } from "@/services/ai/AIProvider";
import type { AIExplanation, AIMessage, AIRequestContext, Question } from "@/types/ai";

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  };
}

function buildMessages(context: AIRequestContext) {
  return [
    ...context.conversation.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: 'user', content: context.prompt },
  ];
}

export class OpenAIProvider extends BaseAIProvider {
  readonly capabilities = {
    streaming: true,
    vision: false,
    functionCalling: false,
    jsonOutput: false,
    embeddings: false,
  };

  async generateResponse({ prompt }: AIRequestContext): Promise<AIMessage> {
    const { apiKey, model } = getOpenAIConfig();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured.');
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: buildMessages({ prompt, conversation: { id: '', title: '', messages: [], createdAt: '', lastUpdated: '' } }),
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI provider error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? '';
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined;

    return {
      id: `openai-${Date.now()}`,
      role: 'assistant',
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
      finishReason: choice?.finish_reason,
      usage,
      model,
      metadata: { provider: 'openai' },
    };
  }

  async *streamResponse({ prompt }: AIRequestContext, options?: { timeoutMs?: number; attempt?: number; signal?: AbortSignal }): AsyncGenerator<import('@/types/ai').AIStreamChunk> {
    const { apiKey, model } = getOpenAIConfig();
    if (!apiKey) {
      yield { type: 'error', error: 'OpenAI API key is not configured.' };
      return;
    }

    const controller = new AbortController();
    const signals = [controller.signal];
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (options?.timeoutMs) {
      timeoutId = globalThis.setTimeout(() => controller.abort(), options.timeoutMs);
    }

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: buildMessages({ prompt, conversation: { id: '', title: '', messages: [], createdAt: '', lastUpdated: '' } }),
          temperature: 0.7,
          max_tokens: 800,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        yield { type: 'error', error: `OpenAI provider error: ${response.status} ${errorText}` };
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        yield { type: 'error', error: 'OpenAI provider stream is unavailable.' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';
      let finishReason: string | undefined;
      let usage: import('@/types/ai').AIUsage | undefined;

      while (true) {
        const result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;
          if (line === 'data: [DONE]') {
            yield { type: 'done', finishReason, usage, model, metadata: { provider: 'openai' } };
            return;
          }
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            const choice = data.choices?.[0];
            const delta = choice?.delta?.content;
            if (delta) {
              content += delta;
              yield { type: 'delta', content: String(delta) };
            }
            if (choice?.finish_reason) {
              finishReason = choice.finish_reason;
            }
            if (data.usage) {
              usage = {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
              };
            }
          } catch {
            // ignore parse failures for partial stream lines
          }
        }
      }

      yield { type: 'done', finishReason, usage, model, metadata: { provider: 'openai' } };
    } catch (error) {
      if (controller.signal.aborted) {
        yield { type: 'error', error: 'OpenAI stream aborted.' };
      } else {
        yield { type: 'error', error: String(error) };
      }
    } finally {
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
    }
  }

  async generateExplanation(question: Question): Promise<AIExplanation> {
    const explanationMessage = await this.generateResponse({
      prompt: `Explain why this question is correct and why the incorrect options are wrong:\n${question.question}`,
      conversation: {
        id: `openai-explain-${Date.now()}`,
        title: 'AI explanation',
        messages: [],
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    });

    return {
      answer: explanationMessage.content,
      simplified: explanationMessage.content,
      relatedConcepts: [question.topic, 'Exam rule application'],
      commonMistakes: ['Misreading the stem', 'Confusing similar terminology'],
      similarQuestions: ['Practice another question on the same topic'],
    };
  }
}
