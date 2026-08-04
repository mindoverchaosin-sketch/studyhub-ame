import { BaseAIProvider, createPlaceholderMessage } from "@/services/ai/AIProvider";
import type { AIExplanation, AIMessage, AIRequestContext, Question } from "@/types/ai";

function getGeminiConfig() {
  return {
    apiKey: process.env.GOOGLE_GEMINI_API_KEY,
    model: process.env.GOOGLE_GEMINI_MODEL ?? 'gemini-1.5',
  };
}

export class GeminiProvider extends BaseAIProvider {
  private get headers() {
    const { apiKey } = getGeminiConfig();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }

  async generateResponse(context: AIRequestContext): Promise<AIMessage> {
    const { apiKey, model } = getGeminiConfig();
    if (!apiKey) {
      throw new Error('Google Gemini API key is not configured.');
    }

    const payload = {
      messages: [
        { author: 'user', content: [{ type: 'text', text: context.prompt }] },
      ],
      temperature: 0.7,
      maxOutputTokens: 800,
    };

    const response = await fetch(`https://gemini.googleapis.com/v1/models/${model}:generateMessage`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Gemini provider error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.map((entry: any) => entry.text).join('') ?? '';
    const usage = data?.usage ? {
      promptTokens: data.usage.promptTokens,
      completionTokens: data.usage.completionTokens,
      totalTokens: data.usage.totalTokens,
    } : undefined;

    return {
      id: `gemini-${Date.now()}`,
      role: 'assistant',
      content: String(content).trim(),
      createdAt: new Date().toISOString(),
      usage,
      model,
      metadata: { provider: 'gemini' },
    };
  }

  async generateExplanation(question: Question): Promise<AIExplanation> {
    const prompt = `Explain why the correct answer is correct and why other options are wrong for:\n${question.question}`;
    const message = await this.generateResponse({ prompt, conversation: {
      id: `gemini-explain-${Date.now()}`,
      title: 'AI explanation',
      messages: [],
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    }});

    return {
      answer: message.content,
      simplified: message.content,
      relatedConcepts: [question.topic, 'Key exam concepts'],
      commonMistakes: ['Mixing up similar rules', 'Rushing through the stem'],
      similarQuestions: ['Practice the same topic with a different scenario'],
    };
  }
}
