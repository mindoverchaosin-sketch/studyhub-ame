import { beforeEach, describe, expect, it, vi } from 'vitest';

const canUseAITutorMock = vi.hoisted(() => vi.fn().mockResolvedValue(true));

vi.mock('@/server/services/content-access.service', () => ({
  contentAccessService: {
    canUseAITutor: canUseAITutorMock,
  },
}));
import { AIService } from '@/server/services/ai/ai-service';
import { ConversationService } from '@/server/services/ai/conversation.service';
import { AIContextBuilderService } from '@/server/services/ai/context-builder.service';
import { RecommendationService } from '@/server/services/ai/recommendation.service';
import { AnalyticsService } from '@/server/services/ai/analytics.service';

class MockProvider {
  async generateResponse() {
    return { id: 'msg-1', role: 'assistant', content: 'mock response', createdAt: new Date().toISOString() };
  }

  async generateExplanation() {
    return {
      answer: 'Option B',
      simplified: 'simple explanation',
      relatedConcepts: ['concept'],
      commonMistakes: ['mistake'],
      similarQuestions: ['similar'],
    };
  }
}

describe('AI backend services', () => {
  beforeEach(() => {
    canUseAITutorMock.mockReset();
    canUseAITutorMock.mockResolvedValue({ allowed: true, requiredFeature: 'aiTools' });
  });

  it('creates and continues conversations', async () => {
    const service = new ConversationService();
    const conversation = await service.createConversation('Test chat');
    expect(conversation.title).toBe('Test chat');

    const updated = await service.addMessage(conversation.id, { id: 'm-1', role: 'user', content: 'hello', createdAt: new Date().toISOString() });
    expect(updated?.messages).toHaveLength(1);
  });

  it('builds a structured context snapshot', () => {
    const service = new AIContextBuilderService();
    const context = service.buildContext({ currentModule: 'Module 7' });
    expect(context.currentModule).toBe('Module 7');
    expect(context.weakTopics).toContain('Corrosion');
  });

  it('builds modular recommendations', () => {
    const service = new RecommendationService();
    const recommendations = service.buildRecommendations({
      mockTestHistory: [{ score: 62 }],
      lessonProgress: [{ completed: false }, { completed: false }],
      questionActivity: [{ recommended: true }],
      weakTopics: ['Corrosion'],
      studyConsistency: 2,
    });

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].title).toContain('Review');
  });

  it('builds analytics snapshots', () => {
    const service = new AnalyticsService();
    const snapshot = service.buildSnapshot();
    expect(snapshot.readinessScore).toBeGreaterThan(0);
    expect(snapshot.streakDays).toBeGreaterThan(0);
  });

  it('routes chat through the AI service layer', async () => {
    const service = new AIService(new MockProvider() as never);
    const response = await service.handleChat({ prompt: 'Explain corrosion' }, 'user-1');
    expect(response.success).toBe(true);
    expect(response.message).toContain('mock response');
  });

  it('denies direct AI service access without aiTools entitlement', async () => {
    canUseAITutorMock.mockResolvedValueOnce({
      allowed: false,
      reason: 'AI Tutor access requires premium subscription',
      requiredFeature: 'aiTools',
    });
    const service = new AIService(new MockProvider() as never);

    await expect(service.handleChat({ prompt: 'Explain corrosion' }, 'free-user')).rejects.toMatchObject({
      status: 403,
      code: 'AI_TUTOR_ACCESS_DENIED',
    });
  });

  it('allows direct AI service access with aiTools entitlement', async () => {
    canUseAITutorMock.mockResolvedValueOnce({ allowed: true, requiredFeature: 'aiTools' });
    const service = new AIService(new MockProvider() as never);

    await expect(service.handleChat({ prompt: 'Explain corrosion' }, 'premium-user')).resolves.toMatchObject({
      success: true,
    });
  });
});
