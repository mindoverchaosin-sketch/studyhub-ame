import { createAIProvider } from '@/services/ai/AIProviderFactory';
import { promptBuilder } from '@/services/ai/PromptBuilder';
import { aiContextBuilderService } from './context-builder.service';
import { conversationService } from './conversation.service';
import { recommendationService } from './recommendation.service';
import { analyticsService } from './analytics.service';
import { placeholderQuestionBankRepository } from './question-bank.service';
import { retrievalService } from './retrieval.service';
import { personalizationService } from './personalization.service';
import { AIServiceError, ValidationError } from './ai-error';
import { metricsService } from '@/server/services/metrics.service';
import { timeAsync, timeSync } from '@/lib/timing';
import { contentAccessService } from '@/server/services/content-access.service';
import type {
  AIRequestPayload,
  AIResponseDTO,
  AIExplainResponseDTO,
  AIRecommendationDTO,
} from './ai-api.types';
import type { AIStreamChunk, AIUsage, AIRequestContext } from '@/types/ai';
import type { AnalyticsService } from './analytics.service';

export class AIService {
  constructor(private readonly provider = createAIProvider()) {}

  private async requireAITutorAccess(userId: string): Promise<void> {
    const access = await contentAccessService.canUseAITutor(userId);
    if (!access.allowed) {
      throw new AIServiceError(access.reason ?? 'AI Tutor access requires premium subscription', 403, 'AI_TUTOR_ACCESS_DENIED');
    }
  }

  /**
   * Builds a throwaway conversation for one-shot features (summarize,
   * generate questions). These never touch persistence and are never
   * addressable by clients.
   */
  private buildEphemeralConversation(title: string): AIRequestContext['conversation'] {
    const now = new Date().toISOString();
    return {
      id: `ephemeral-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      messages: [],
      createdAt: now,
      lastUpdated: now,
    };
  }

  private async buildRequestContext(payload: AIRequestPayload, userId: string, conversation: AIRequestContext['conversation']): Promise<AIRequestContext> {
    const contextSnapshot = timeSync('AIService', 'buildContext', () => aiContextBuilderService.buildContext(payload.context ?? {}));
    const retrievalContext = await timeAsync('AIService', 'buildRetrievalContext', () => retrievalService.buildRetrievalContext(payload.context ?? {}));
    const learnerProfile = await timeAsync('AIService', 'buildLearnerProfile', () => personalizationService.buildLearnerProfile(
      userId,
      payload.context ?? {},
      contextSnapshot,
    ));
    const prompt = timeSync('AIService', 'buildPrompt', () => promptBuilder.buildPrompt(payload.prompt, contextSnapshot, retrievalContext, {
      includeContext: true,
      includeRetrieval: true,
      includeHistory: false,
      maxChunks: 3,
    }, learnerProfile));

    return {
      prompt,
      conversation,
      contextSnapshot,
      retrievalContext,
      learnerProfile,
    };
  }

  async handleChat(payload: AIRequestPayload, userId: string): Promise<AIResponseDTO> {
    await this.requireAITutorAccess(userId)
    metricsService.recordAIRequest()

    if (!payload.prompt?.trim()) {
      throw new ValidationError('A prompt is required.');
    }

    // Ownership: the conversation is resolved for this user only; foreign or
    // unknown ids both resolve to null so callers cannot probe existence.
    const conversation = await (payload.conversationId
      ? conversationService.getConversation(payload.conversationId, userId)
      : conversationService.createConversation('Tutor session', userId));

    if (!conversation) {
      throw new AIServiceError('Conversation not found.', 404, 'CONVERSATION_NOT_FOUND');
    }

    const requestContext = await this.buildRequestContext(payload, userId, conversation);
    const message = await timeAsync('AIService', 'generateResponse', () => this.provider.generateResponse(requestContext));
    await conversationService.addMessage(conversation.id, message, userId);

    return {
      success: true,
      message: message.content,
      conversationId: conversation.id,
      provider: process.env.AI_PROVIDER?.toLowerCase() ?? 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  async *streamChat(payload: AIRequestPayload, userId: string, options?: { timeoutMs?: number; attempt?: number; signal?: AbortSignal }): AsyncGenerator<AIStreamChunk> {
    await this.requireAITutorAccess(userId)
    metricsService.recordAIRequest()
    metricsService.recordAIStreamingStart()

    if (!payload.prompt?.trim()) {
      throw new AIServiceError('A prompt is required.');
    }

    const conversation = await (payload.conversationId
      ? conversationService.getConversation(payload.conversationId, userId)
      : conversationService.createConversation('Tutor session', userId));

    if (!conversation) {
      throw new AIServiceError('Conversation not found.', 404, 'CONVERSATION_NOT_FOUND');
    }

    const requestContext = await this.buildRequestContext(payload, userId, conversation);

    if (typeof this.provider.streamResponse !== 'function') {
      const response = await timeAsync('AIService', 'generateResponse', () => this.provider.generateResponse(requestContext));
      await conversationService.addMessage(conversation.id, response, userId);
      yield { type: 'delta', content: response.content, conversationId: conversation.id };
      yield {
        type: 'done',
        finishReason: response.finishReason,
        usage: response.usage,
        model: response.model,
        metadata: response.metadata,
        conversationId: conversation.id,
      };
      return;
    }

    const assistantMessage: { id: string; role: 'assistant'; content: string; createdAt: string; model: string; metadata: Record<string, unknown>; finishReason?: string; usage?: AIUsage } = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: process.env.AI_PROVIDER?.toLowerCase() ?? 'mock',
      metadata: { provider: process.env.AI_PROVIDER?.toLowerCase() ?? 'mock' },
    };

    try {
      for await (const chunk of this.provider.streamResponse(requestContext, options)) {
        const enrichedChunk = { ...chunk, conversationId: conversation.id };
        if (chunk.type === 'delta' && chunk.content) {
          assistantMessage.content += chunk.content;
          yield enrichedChunk;
        } else if (chunk.type === 'done') {
          assistantMessage.finishReason = chunk.finishReason;
          assistantMessage.usage = chunk.usage;
          assistantMessage.model = chunk.model ?? assistantMessage.model;
          assistantMessage.metadata = { ...assistantMessage.metadata, ...chunk.metadata };
          await conversationService.addMessage(conversation.id, assistantMessage, userId);
          yield enrichedChunk;
          return;
        } else if (chunk.type === 'error') {
          yield enrichedChunk;
          return;
        }
      }

      await conversationService.addMessage(conversation.id, assistantMessage, userId);
      yield {
        type: 'done',
        finishReason: assistantMessage.finishReason ?? 'stop',
        usage: assistantMessage.usage,
        model: assistantMessage.model,
        metadata: assistantMessage.metadata,
        conversationId: conversation.id,
      };
    } catch (error) {
      yield { type: 'error', error: String(error), conversationId: conversation.id };
    }
  }

  async handleExplain(questionId: string): Promise<AIExplainResponseDTO> {
    metricsService.recordAIRequest()

    const question = await placeholderQuestionBankRepository.getQuestion(questionId);
    if (!question) {
      throw new AIServiceError('Question not found.', 404, 'QUESTION_NOT_FOUND');
    }

    const explanation = await this.provider.generateExplanation(question);

    return {
      success: true,
      explanation,
      provider: 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  async handleRecommendations(userId: string): Promise<AIRecommendationDTO> {
    metricsService.recordAIRequest()

    const recommendations = timeSync('AIService', 'buildRecommendations', () => recommendationService.buildRecommendations({
      mockTestHistory: [{ score: 62 }, { score: 74 }],
      lessonProgress: [{ completed: true }, { completed: false }, { completed: false }],
      questionActivity: [{ recommended: true }],
      weakTopics: ['Corrosion'],
      studyConsistency: 3,
    }));

    return {
      success: true,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  async handleSummarize(prompt: string): Promise<AIResponseDTO> {
    metricsService.recordAIRequest()

    if (!prompt?.trim()) {
      throw new ValidationError('A prompt is required.');
    }

    const summaryConversation = this.buildEphemeralConversation('Summary');
    const message = await this.provider.generateResponse({
      prompt: `Summarize: ${prompt}`,
      conversation: summaryConversation,
    });

    return {
      success: true,
      message: message.content,
      provider: 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  async handleGenerateQuestions(topic: string): Promise<AIResponseDTO> {
    metricsService.recordAIRequest()

    if (!topic?.trim()) {
      throw new ValidationError('A topic is required.');
    }

    const generatedConversation = this.buildEphemeralConversation('Generated questions');
    const message = await this.provider.generateResponse({
      prompt: `Generate questions for ${topic}`,
      conversation: generatedConversation,
    });

    return {
      success: true,
      message: message.content,
      provider: 'mock',
      timestamp: new Date().toISOString(),
    };
  }

  async getAnalytics(): Promise<ReturnType<AnalyticsService['buildSnapshot']>> {
    return analyticsService.buildSnapshot();
  }
}

export const aiService = new AIService();
