import type { AIContextSnapshot, AIRequestContext } from '@/types/ai';
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
