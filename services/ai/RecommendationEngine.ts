import type { Recommendation } from "@/types/ai";

export interface RecommendationInput {
  weakTopics: string[];
  recentMockPerformance: number;
  lessonCompletion: number;
  studyStreak: number;
}

export function createRecommendationEngine() {
  return {
    generate(input: RecommendationInput): Recommendation[] {
      const recommendations: Recommendation[] = [];

      if (input.weakTopics.length > 0) {
        recommendations.push({
          id: "weak-topic",
          title: `Review ${input.weakTopics[0]}`,
          description: "Revisit the topic and practice a focused set of questions.",
          reason: "Weak topic detected from recent performance.",
          ctaLabel: "Start revision",
          href: "/student/question-bank",
          priority: "High",
        });
      }

      if (input.recentMockPerformance < 70) {
        recommendations.push({
          id: "retry-mock",
          title: "Retry Mock Test 3",
          description: "Rebuild confidence with a quick follow-up set.",
          reason: "Recent mock performance needs reinforcement.",
          ctaLabel: "Retry now",
          href: "/student/mock-exams",
          priority: "High",
        });
      }

      if (input.lessonCompletion < 80) {
        recommendations.push({
          id: "complete-module",
          title: "Complete Module 6",
          description: "Finish the current lesson block and unlock the next challenge.",
          reason: "Lesson completion is below the recommended pace.",
          ctaLabel: "Resume module",
          href: "/student/modules",
          priority: "Medium",
        });
      }

      if (input.studyStreak > 0) {
        recommendations.push({
          id: "streak",
          title: "Protect your study streak",
          description: "Keep the momentum with a short review session today.",
          reason: "A steady streak is already underway.",
          ctaLabel: "Keep going",
          href: "/student/adaptive-learning",
          priority: "Medium",
        });
      }

      return recommendations;
    },
  };
}
