import type { AIContextSnapshot, AIRequestContext, AILearnerProfile } from '@/types/ai';
import type { AIContentChunk, AIRetrievalContext } from '@/types/ai';

export interface PromptBuilderOptions {
  includeContext?: boolean;
  includeRetrieval?: boolean;
  includeHistory?: boolean;
  maxChunks?: number;
}

export class PromptBuilder {
  buildPrompt(
    basePrompt: string,
    contextSnapshot: AIContextSnapshot,
    retrievalContext?: AIRetrievalContext,
    options: PromptBuilderOptions = {
      includeContext: true,
      includeRetrieval: true,
      includeHistory: false,
      maxChunks: 3,
    },
    learnerProfile?: AILearnerProfile,
  ): string {
    let assembled = basePrompt.trim();

    if (options.includeContext) {
      assembled += `\n\nLearner context:\n`;
      assembled += `Module: ${contextSnapshot.currentModule}\n`;
      assembled += `Lesson: ${contextSnapshot.currentLesson}\n`;
      assembled += `Weak topics: ${contextSnapshot.weakTopics.join(', ')}\n`;
      assembled += `Recent questions: ${contextSnapshot.recentQuestions.join(', ')}\n`;
      assembled += `Study streak: ${contextSnapshot.studyStreak}\n`;
      assembled += `Learning goals: ${contextSnapshot.learningGoals.join(', ')}\n`;
    }

    if (learnerProfile) {
      assembled += `\n\nPersonalized learner profile:\n`;
      assembled += this.formatLearnerProfile(learnerProfile);
    }

    if (options.includeRetrieval && retrievalContext) {
      assembled += `\nGrounding sources:\n${retrievalContext.sourceSummary}\n`;
      assembled += this.formatRetrievalChunks(retrievalContext.retrievedChunks.slice(0, options.maxChunks ?? 3));
    }

    if (options.includeHistory) {
      assembled += `\nConversation history:\n`;
      assembled += this.formatHistory(contextSnapshot);
    }

    return assembled.trim();
  }

  private formatLearnerProfile(profile: AILearnerProfile): string {
    const topRecommendations = profile.topRecommendations.length
      ? profile.topRecommendations.map((recommendation, index) =>
          `${index + 1}. ${recommendation.title} (${recommendation.priority}) - ${recommendation.reason}`,
        ).join('\n')
      : 'No top recommendations available.';

    return [
      `Overall mastery: ${profile.overallMastery}% (${profile.masteryConfidence}, trend: ${profile.masteryTrend})`,
      `Readiness: ${profile.readinessScore}% (${profile.readinessConfidence}, risk: ${profile.readinessRisk})`,
      `Strong areas: ${profile.strongAreas.join(', ') || 'None'}`,
      `Weak areas: ${profile.weakAreas.join(', ') || 'None'}`,
      `Recommended actions: ${profile.recommendedActions.join(', ') || 'None'}`,
      `Weekly study plan: ${profile.weeklyPlanSummary}`,
      `Top recommendations:\n${topRecommendations}`,
      `Analytics summary: ${profile.analyticsSummary}`,
      `Knowledge graph summary: ${profile.knowledgeGraphSummary}`,
    ].join('\n');
  }

  private formatRetrievalChunks(chunks: AIContentChunk[]): string {
    if (!chunks.length) {
      return 'No retrieved content available.';
    }

    return chunks
      .map((chunk, index) => `Source ${index + 1}: [${chunk.sourceType}] ${chunk.title} — ${chunk.text}`)
      .join('\n');
  }

  private formatHistory(contextSnapshot: AIContextSnapshot): string {
    return `Recent interactions are not yet available in the static snapshot.`;
  }
}

export const promptBuilder = new PromptBuilder();
