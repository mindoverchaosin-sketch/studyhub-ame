import type { Recommendation } from '@/types/ai';

export interface RecommendationInput {
  mockTestHistory: Array<{ score: number }>;
  lessonProgress: Array<{ completed: boolean }>;
  questionActivity: Array<{ recommended?: boolean }>;
  weakTopics: string[];
  studyConsistency: number;
}

export class RecommendationService {
  buildRecommendations(input: RecommendationInput): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const averageScore = input.mockTestHistory.length > 0 ? input.mockTestHistory.reduce((sum, item) => sum + item.score, 0) / input.mockTestHistory.length : 72;
    const completedLessons = input.lessonProgress.filter((lesson) => lesson.completed).length;

    if (input.weakTopics.length > 0) {
      recommendations.push({
        id: 'recommend-weak-topic',
        title: `Review ${input.weakTopics[0]}`,
        description: 'Revisit the topic with an AI-guided practice set.',
        reason: 'Weak topic detected from recent activity.',
        ctaLabel: 'Start revision',
        href: '/student/question-bank',
        priority: 'High',
      });
    }

    if (averageScore < 70) {
      recommendations.push({
        id: 'recommend-mock',
        title: 'Retry Mock Test 3',
        description: 'Reinforce weak concepts with a targeted follow-up mock.',
        reason: 'Recent mock performance is below the target.',
        ctaLabel: 'Retry now',
        href: '/student/mock-exams',
        priority: 'High',
      });
    }

    if (completedLessons < 3) {
      recommendations.push({
        id: 'recommend-lesson',
        title: 'Complete Module 6',
        description: 'Finish the current lesson block and unlock the next challenge.',
        reason: 'Lesson progress is still behind the expected pace.',
        ctaLabel: 'Resume module',
        href: '/student/modules',
        priority: 'Medium',
      });
    }

    if (input.studyConsistency > 0) {
      recommendations.push({
        id: 'recommend-daily-goal',
        title: 'Protect your study streak',
        description: 'Keep momentum with a short review session today.',
        reason: 'Consistency remains strong and should be maintained.',
        ctaLabel: 'Keep going',
        href: '/student/adaptive-learning',
        priority: 'Medium',
      });
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();
