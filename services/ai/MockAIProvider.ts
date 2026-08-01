import { BaseAIProvider, createPlaceholderMessage } from "@/services/ai/AIProvider";
import type { AIExplanation, AIMessage, AIRequestContext, Question, AIStreamChunk } from "@/types/ai";

export class MockAIProvider extends BaseAIProvider {
  readonly capabilities = {
    streaming: true,
    vision: false,
    functionCalling: false,
    jsonOutput: false,
    embeddings: false,
  };

  async generateResponse({ prompt }: AIRequestContext): Promise<AIMessage> {
    const topic = prompt.toLowerCase().includes("corrosion") ? "corrosion" : "the lesson";
    return createPlaceholderMessage(`placeholder AI response for "${prompt}". The tutor is ready to explain ${topic} in a simple, exam-focused way once a real model is connected.`);
  }

  async *streamResponse({ prompt }: AIRequestContext): AsyncGenerator<AIStreamChunk> {
    const content = `placeholder AI response for "${prompt}". The tutor is ready to explain ${prompt.toLowerCase().includes("corrosion") ? "corrosion" : "the lesson"} in a simple, exam-focused way once a real model is connected.`;
    for (let i = 0; i < content.length; i += 20) {
      yield { type: 'delta', content: content.slice(i, i + 20) };
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    yield { type: 'done', finishReason: 'stop', model: 'mock', metadata: { provider: 'mock' } };
  }

  async generateExplanation(question: Question): Promise<AIExplanation> {
    return {
      answer: `Option B is the best answer because it aligns with ${question.topic} and the core exam objective.`,
      simplified: `This is a simple placeholder explanation for ${question.topic}.`,
      relatedConcepts: [`${question.topic} fundamentals`, "Review the regulation context"],
      commonMistakes: ["Confusing similar terminology", "Ignoring the chapter objective"],
      similarQuestions: ["Practice a recall-based variant", "Compare this concept with a worked example"],
    };
  }
}
