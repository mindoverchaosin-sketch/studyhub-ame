import { describe, expect, it } from 'vitest';
import { promptBuilder } from '@/services/ai/PromptBuilder';

describe('PromptBuilder', () => {
  it('assembles a prompt with context and retrieval chunks', () => {
    const prompt = promptBuilder.buildPrompt(
      'Explain corrosion for my exam preparation.',
      {
        currentModule: 'Module 6: Aircraft Materials',
        currentLesson: 'Corrosion prevention',
        mockPerformance: 72,
        weakTopics: ['Corrosion', 'Hydraulic systems'],
        recentQuestions: ['Aircraft materials basics', 'Load calculations'],
        studyStreak: 4,
        learningGoals: ['Improve accuracy', 'Complete one mock', 'Review weak topics'],
      },
      {
        retrievalQuery: 'corrosion',
        sourceSummary: 'QUESTION - What causes corrosion?: Because of oxidation.',
        retrievedSources: [
          {
            id: 'q1',
            type: 'question',
            title: 'What causes corrosion?',
            excerpt: 'Because of oxidation.',
            metadata: { topic: 'Corrosion' },
          },
        ],
        retrievedChunks: [
          {
            id: 'chunk-1',
            sourceId: 'q1',
            sourceType: 'question',
            title: 'What causes corrosion?',
            text: 'Because of oxidation.',
            metadata: { relevance: 1 },
          },
        ],
      },
      { includeContext: true, includeRetrieval: true, maxChunks: 1 },
    );

    expect(prompt).toContain('Explain corrosion for my exam preparation.');
    expect(prompt).toContain('Learner context:');
    expect(prompt).toContain('Grounding sources:');
    expect(prompt).toContain('Source 1: [question] What causes corrosion?');
  });
});
