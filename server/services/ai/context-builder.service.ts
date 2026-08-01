export interface AIContextSnapshot {
  currentModule: string;
  currentLesson: string;
  mockPerformance: number;
  weakTopics: string[];
  recentQuestions: string[];
  studyStreak: number;
  learningGoals: string[];
}

export class AIContextBuilderService {
  buildContext(overrides: Partial<AIContextSnapshot> = {}): AIContextSnapshot {
    return {
      currentModule: 'Module 6: Aircraft Materials',
      currentLesson: 'Corrosion prevention',
      mockPerformance: 72,
      weakTopics: ['Corrosion', 'Hydraulic systems'],
      recentQuestions: ['Aircraft materials basics', 'Load calculations'],
      studyStreak: 4,
      learningGoals: ['Improve accuracy', 'Complete one mock', 'Review weak topics'],
      ...overrides,
    };
  }
}

export const aiContextBuilderService = new AIContextBuilderService();
