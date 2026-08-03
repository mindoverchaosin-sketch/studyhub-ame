import { timeAsync, timeSync } from '@/lib/timing';
import { analyticsService } from './analytics.service';
import { knowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';
import { masteryService, type MasteryRequestContext } from '@/server/services/learning/mastery.service';
import { readinessService } from '@/server/services/learning/readiness.service';
import { recommendationService as learningRecommendationService } from '@/server/services/learning/recommendation.service';
import { studyPlannerService } from '@/server/services/learning/study-planner.service';
import type { AIContextSnapshot } from '@/types/ai';
import type {
  KnowledgeGraphSummary,
  Recommendation,
  WeeklyStudyPlan,
  MasteryResult,
  ReadinessResult,
} from '@/types/learning';

export interface AILearnerProfile {
  overallMastery: number;
  masteryConfidence: string;
  masteryTrend: string;
  readinessScore: number;
  readinessRisk: string;
  readinessConfidence: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendedActions: string[];
  topRecommendations: Array<{ title: string; reason: string; priority: number; source: string }>;
  weeklyPlanSummary: string;
  analyticsSummary: string;
  knowledgeGraphSummary: string;
}

interface PersonalizationContext {
  masteryContext: MasteryRequestContext;
  overallMastery?: MasteryResult;
  readiness?: ReadinessResult;
  weeklyPlan?: WeeklyStudyPlan;
  recommendations?: Recommendation[];
  analyticsSnapshot?: ReturnType<typeof analyticsService.buildSnapshot>;
  knowledgeGraphSummary?: KnowledgeGraphSummary;
  learnerProfile?: AILearnerProfile;
}

export class PersonalizationService {
  async buildLearnerProfile(
    studentId: string,
    contextOverrides: Partial<AIContextSnapshot> = {},
    _contextSnapshot?: AIContextSnapshot,
    personalizationContext?: PersonalizationContext,
  ): Promise<AILearnerProfile> {
    const context = await this.buildPersonalizationContext(studentId, contextOverrides, _contextSnapshot, personalizationContext);
    return context.learnerProfile!;
  }

  private async buildPersonalizationContext(
    studentId: string,
    contextOverrides: Record<string, unknown>,
    _contextSnapshot?: AIContextSnapshot,
    personalizationContext?: PersonalizationContext,
  ): Promise<PersonalizationContext> {
    const currentDate = (contextOverrides.currentDate as string) ?? new Date().toISOString().slice(0, 10);
    const examDate = contextOverrides.examDate as string | undefined;

    const masteryContext = personalizationContext?.masteryContext ?? await timeAsync('PersonalizationService', 'createRequestContext', () => masteryService.createRequestContext(studentId));

    const [overallMastery, readiness, weeklyPlan, recommendations, analyticsSnapshot, knowledgeGraphSummary] = await Promise.all([
      personalizationContext?.overallMastery ?? timeAsync('PersonalizationService', 'getOverallMastery', () => masteryService.getOverallMastery(studentId, masteryContext)),
      personalizationContext?.readiness ?? timeAsync('PersonalizationService', 'getOverallReadiness', () => readinessService.getOverallReadiness(studentId, { currentDate, examDate }, masteryContext)),
      personalizationContext?.weeklyPlan ?? timeAsync('PersonalizationService', 'generateWeeklyPlan', () => studyPlannerService.generateWeeklyPlan(studentId, { currentDate }, masteryContext)),
      personalizationContext?.recommendations ?? timeAsync('PersonalizationService', 'getTopRecommendations', () => learningRecommendationService.getTopRecommendations(studentId, 3, { currentDate, examDate }, { masteryContext })),
      personalizationContext?.analyticsSnapshot ?? timeSync('PersonalizationService', 'buildSnapshot', () => analyticsService.buildSnapshot()),
      personalizationContext?.knowledgeGraphSummary ?? timeAsync('PersonalizationService', 'knowledgeGraphSummary', () => knowledgeGraphService.summary()),
    ]);

    const topRecommendations = recommendations.map((recommendation) => ({
      title: recommendation.title,
      reason: recommendation.reason,
      priority: recommendation.priority,
      source: recommendation.source,
    }));

    const weeklyItems = weeklyPlan.dailyPlans.flatMap((plan) => plan.items).slice(0, 3);
    const weeklyPlanSummary = weeklyItems.length
      ? weeklyItems.map((item, index) => `${index + 1}. ${item.title} (${item.estimatedDurationMinutes}m)`).join('; ')
      : 'No study plan items are currently scheduled.';

    const learnerProfile: AILearnerProfile = {
      overallMastery: Math.round(overallMastery.score),
      masteryConfidence: overallMastery.confidenceLabel,
      masteryTrend: overallMastery.trend,
      readinessScore: Math.round(readiness.readinessScore),
      readinessRisk: readiness.risk,
      readinessConfidence: readiness.confidence,
      strongAreas: readiness.strongestAreas,
      weakAreas: readiness.weakestAreas,
      recommendedActions: readiness.recommendedActions.map((action) => action.action),
      topRecommendations,
      weeklyPlanSummary,
      analyticsSummary: `Current readiness is ${analyticsSnapshot.readinessScore} with a ${analyticsSnapshot.streakDays}-day streak and ${analyticsSnapshot.studyTimeMinutes} minutes studied.`,
      knowledgeGraphSummary: `Knowledge graph contains ${knowledgeGraphSummary.nodesCount} nodes and ${knowledgeGraphSummary.edgesCount} edges.`,
    };

    return {
      masteryContext,
      overallMastery,
      readiness,
      weeklyPlan,
      recommendations,
      analyticsSnapshot,
      knowledgeGraphSummary,
      learnerProfile,
    };
  }
}

export const personalizationService = new PersonalizationService();
