import { BaseAIProvider, createPlaceholderMessage } from "@/services/ai/AIProvider";
import type { AIExplanation, AIMessage, AIRequestContext, Question } from "@/types/ai";

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/chat/completions';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-3.5';

export class AnthropicProvider extends BaseAIProvider {
  private get headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANTHROPIC_API_KEY}`,
    };
  }

  private buildPrompt(context: AIRequestContext) {
    const history = context.conversation.messages
      .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
      .join('\n');

    return `${history}\nUser: ${context.prompt}`;
  }

  async generateResponse(context: AIRequestContext): Promise<AIMessage> {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is not configured.');
    }

    const payload = {
      model: ANTHROPIC_MODEL,
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(context),
        },
      ],
      temperature: 0.65,
      max_tokens_to_sample: 800,
    };

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic provider error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.completion ?? data.choices?.[0]?.message?.content ?? '';
    const finishReason = data.choices?.[0]?.finish_reason ?? undefined;
    const usage = data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined;

    return {
      id: `anthropic-${Date.now()}`,
      role: 'assistant',
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
      finishReason,
      usage,
      model: ANTHROPIC_MODEL,
      metadata: { provider: 'anthropic' },
    };
  }

  async generateExplanation(question: Question): Promise<AIExplanation> {
    const prompt = `Explain the following question and why the answer is correct:\n${question.question}`;
    const message = await this.generateResponse({ prompt, conversation: {
      id: `anthropic-explain-${Date.now()}`,
      title: 'AI explanation',
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }});

    return {
      answer: message.content,
      simplified: message.content,
      relatedConcepts: [question.topic, 'Review the exam objective'],
      commonMistakes: ['Misreading the question stem', 'Confusing similar concepts'],
      similarQuestions: [`Compare with other ${question.topic} practice`, 'Review related DGCA rules'],
    };
  }
}
