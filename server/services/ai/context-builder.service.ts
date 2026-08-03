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
  buildContext(overrides: unknown = {}): AIContextSnapshot {
    return {
      currentModule: 'Module 6: Aircraft Materials',
      currentLesson: 'Corrosion prevention',
      mockPerformance: 72,
      weakTopics: ['Corrosion', 'Hydraulic systems'],
      recentQuestions: ['Aircraft materials basics', 'Load calculations'],
      studyStreak: 4,
      learningGoals: ['Improve accuracy', 'Complete one mock', 'Review weak topics'],
      ...this.sanitizeOverrides(overrides),
    };
  }

  private sanitizeOverrides(overrides: unknown): Partial<AIContextSnapshot> {
    const sanitized: Partial<AIContextSnapshot> = {};
    const safeOverrides = typeof overrides === 'object' && overrides !== null ? overrides as Record<string, unknown> : {};

    if (typeof safeOverrides.currentModule === 'string' && safeOverrides.currentModule.trim().length > 0) {
      sanitized.currentModule = safeOverrides.currentModule.trim();
    }

    if (typeof safeOverrides.currentLesson === 'string' && safeOverrides.currentLesson.trim().length > 0) {
      sanitized.currentLesson = safeOverrides.currentLesson.trim();
    }

    if (typeof safeOverrides.mockPerformance === 'number' && safeOverrides.mockPerformance >= 0 && safeOverrides.mockPerformance <= 100) {
      sanitized.mockPerformance = safeOverrides.mockPerformance;
    }

    if (Array.isArray(safeOverrides.weakTopics) && safeOverrides.weakTopics.every((value) => typeof value === 'string' && value.trim().length > 0)) {
      sanitized.weakTopics = safeOverrides.weakTopics.map((value) => value.trim());
    }

    if (Array.isArray(safeOverrides.recentQuestions) && safeOverrides.recentQuestions.every((value) => typeof value === 'string' && value.trim().length > 0)) {
      sanitized.recentQuestions = safeOverrides.recentQuestions.map((value) => value.trim());
    }

    if (typeof safeOverrides.studyStreak === 'number' && safeOverrides.studyStreak >= 0 && safeOverrides.studyStreak <= 365) {
      sanitized.studyStreak = safeOverrides.studyStreak;
    }

    if (Array.isArray(safeOverrides.learningGoals) && safeOverrides.learningGoals.every((value) => typeof value === 'string' && value.trim().length > 0)) {
      sanitized.learningGoals = safeOverrides.learningGoals.map((value) => value.trim());
    }

    return sanitized;
  }
}

export const aiContextBuilderService = new AIContextBuilderService();
