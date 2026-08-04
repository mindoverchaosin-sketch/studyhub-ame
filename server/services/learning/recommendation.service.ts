import { knowledgeGraphService } from './knowledge-graph.service';
import { MasteryService, type MasteryRequestContext } from './mastery.service';
import { StudyPlannerService } from './study-planner.service';
import { ReadinessService } from './readiness.service';
import { instrumentService, logger } from '@/lib/logger';
import { timeAsync, timeSync } from '@/lib/timing';
import type {
  Recommendation,
  RecommendationConfig,
  RecommendationConfidence,
  RecommendationInput,
  RecommendationSource,
  RecommendationSummary,
  ReadinessResult,
  MasteryResult,
} from '@/types/learning';
import type { KnowledgeGraphService } from './knowledge-graph.service';

const defaultConfig: RecommendationConfig = {
  weights: {
    masteryGap: 0.30,
    readinessImpact: 0.25,
    examRelevance: 0.15,
    prerequisiteImportance: 0.15,
    recency: 0.10,
    engagement: 0.05,
  },
  durationMinutes: {
    nextLesson: 30,
    practiceQuestions: 20,
    mockTest: 60,
    revisionSession: 25,
    aiTutor: 40,
    moduleReview: 45,
  },
  weakTopicThreshold: 70,
  lowReadinessThreshold: 55,
  recentActivityDays: 14,
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

interface RecommendationRequestContext {
  studentId: string
  currentDate: string
  examDate?: string
  masteryContext: MasteryRequestContext
  weakTopics?: MasteryResult[]
  overallMastery?: MasteryResult
  readiness?: ReadinessResult
  plannerItems?: { dailyPlans: Array<{ items: Array<{ id: string; referenceEntityId?: string; type: string }> }> }
  recentSignals?: Array<{ nodeId: string; signal: { kind: string; timestamp: number; correct?: boolean; score?: number; maxScore?: number } }>
  signalSummary?: Record<string, number>
}

export class RecommendationService {
  private config: RecommendationConfig;
  private kg: KnowledgeGraphService;
  private mastery: MasteryService;
  private planner: StudyPlannerService;
  private readiness: ReadinessService;

  constructor(
    config?: Partial<RecommendationConfig>,
    kg?: KnowledgeGraphService,
    mastery?: MasteryService,
    planner?: StudyPlannerService,
    readiness?: ReadinessService,
  ) {
    this.config = {
      ...defaultConfig,
      ...(config ?? {}),
      weights: {
        ...defaultConfig.weights,
        ...(config?.weights ?? {}),
      },
      durationMinutes: {
        ...defaultConfig.durationMinutes,
        ...(config?.durationMinutes ?? {}),
      },
    };
    this.kg = kg ?? knowledgeGraphService;
    this.mastery = mastery ?? new MasteryService(undefined, this.kg);
    this.planner = planner ?? new StudyPlannerService(undefined, this.kg, this.mastery);
    this.readiness = readiness ?? new ReadinessService(undefined, this.kg, this.mastery, this.planner);
  }

  async getRecommendations(studentId: string, input?: RecommendationInput, context?: Partial<RecommendationRequestContext>): Promise<Recommendation[]> {
    return instrumentService('RecommendationService', 'getRecommendations', async () => {
      return timeAsync('recommendation', 'total', async () => {
        const requestContext = await this.buildRecommendationContext(studentId, input, context);
        const recommendations = await this.collectRecommendations(
          studentId,
          requestContext.weakTopics!,
          requestContext.overallMastery!,
          requestContext.readiness!,
          requestContext.plannerItems!,
          requestContext.signalSummary!,
        );

        const unique = timeSync('recommendation', 'deduplicate', () => this.deduplicateRecommendations(recommendations));
        const ranked = timeSync('recommendation', 'rank', () => this.rankRecommendations(unique, requestContext.overallMastery!, requestContext.readiness!, requestContext.weakTopics!, requestContext.examDate));
        const selection = timeSync('recommendation', 'final_selection', () => ranked.slice(0, input?.limit ?? 10));
        logger.info('recommendation.response_build.complete', { candidateCount: recommendations.length, deduplicatedCount: unique.length, rankedCount: ranked.length, returnedCount: selection.length });
        return selection;
      });
    });
  }

  private async collectRecommendations(
    studentId: string,
    weakTopics: MasteryResult[],
    overallMastery: MasteryResult,
    readiness: ReadinessResult,
    plannerItems: { dailyPlans: Array<{ items: Array<{ id: string; referenceEntityId?: string; type: string }> }> },
    signalSummary: Record<string, number>,
  ): Promise<Recommendation[]> {
    const prerequisiteRecommendations = await timeAsync('recommendation', 'prerequisite_filter', async () => this.recommendFromPrerequisites(studentId, weakTopics));

    const generated = timeSync('recommendation', 'generate_candidates', () => [
      ...this.recommendFromWeakSignals(studentId, weakTopics, readiness),
      ...this.recommendFromReadiness(studentId, readiness),
      ...this.recommendFromStrongPerformance(studentId, overallMastery, readiness),
      ...this.recommendFromStrongSignals(studentId, signalSummary, readiness),
      ...this.recommendFromPlanner(studentId, plannerItems, readiness),
      ...this.recommendFromMasteryTrends(studentId, weakTopics),
      ...this.recommendFromMockPerformance(studentId, readiness),
      ...this.recommendFromRecentActivity(studentId, signalSummary),
    ]);

    const allRecommendations = [...generated, ...prerequisiteRecommendations];
    logger.info('recommendation.generate_candidates.complete', { candidateCount: allRecommendations.length, prerequisiteCount: prerequisiteRecommendations.length });
    return allRecommendations;
  }

  async getTopRecommendations(studentId: string, limit: number, input?: RecommendationInput, context?: Partial<RecommendationRequestContext>): Promise<Recommendation[]> {
    return this.getRecommendations(studentId, { ...(input ?? {}), limit }, context);
  }

  async getRecommendationSummary(studentId: string, input?: RecommendationInput, context?: Partial<RecommendationRequestContext>): Promise<RecommendationSummary> {
    return instrumentService('RecommendationService', 'getRecommendationSummary', async () => {
      const requestContext = await this.buildRecommendationContext(studentId, input, context);
      const recommendations = await this.getRecommendations(studentId, input, requestContext);

      return {
        studentId,
        totalRecommendations: recommendations.length,
        averagePriority: recommendations.reduce((sum, item) => sum + item.priority, 0) / Math.max(recommendations.length, 1),
        readinessScore: requestContext.readiness!.readinessScore,
        masteryScore: requestContext.overallMastery!.score,
        weakTopics: requestContext.weakTopics!.map((topic) => topic.entityId),
        topSources: this.topRecommendationSources(recommendations),
        generatedAt: Date.now(),
      };
    });
  }

  private async findWeakTopics(studentId: string, context: RecommendationRequestContext): Promise<MasteryResult[]> {
    if (context.weakTopics) return context.weakTopics;

    const topics = await this.kg.listNodes({ type: 'topic' });
    const scores = await Promise.all(topics.map((topic) => this.mastery.getTopicMastery(studentId, topic.id, context.masteryContext)));
    return scores.filter((score) => score.score < this.config.weakTopicThreshold);
  }

  private async getRecentSignalsFromGraph(studentGraph: { nodes: Record<string, { nodeId: string; signals: Array<{ kind: string; timestamp: number; correct?: boolean; score?: number; maxScore?: number }> }> }, days: number) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return Object.values(studentGraph.nodes).flatMap((node) =>
      node.signals.filter((signal) => signal.timestamp >= since).map((signal) => ({ nodeId: node.nodeId, signal })),
    );
  }

  private async getRecentSignals(studentId: string, days: number, context: RecommendationRequestContext) {
    if (context.recentSignals) return context.recentSignals;
    return this.getRecentSignalsFromGraph(context.masteryContext.studentGraph, days);
  }

  private summarizeSignals(recentSignals: Array<{ nodeId: string; signal: { kind: string; timestamp: number; correct?: boolean; score?: number; maxScore?: number } }>) {
    const counts: Record<string, number> = {
      answered: 0,
      correctAnswered: 0,
      mockPerformanceScore: 0,
      mockPerformanceMax: 0,
    };

    for (const item of recentSignals) {
      counts[item.signal.kind] = (counts[item.signal.kind] ?? 0) + 1;

      if (item.signal.kind === 'answered' && item.signal.correct) {
        counts.correctAnswered += 1;
      }

      if (item.signal.kind === 'mockPerformance') {
        counts.mockPerformanceScore = Math.max(counts.mockPerformanceScore, item.signal.score ?? counts.mockPerformanceScore);
        counts.mockPerformanceMax = Math.max(counts.mockPerformanceMax, item.signal.maxScore ?? counts.mockPerformanceMax);
      }
    }

    return counts;
  }

  private recommendFromWeakSignals(studentId: string, weakTopics: MasteryResult[], readiness: ReadinessResult): Recommendation[] {
    return weakTopics.slice(0, 3).map((topic) => {
      const priority = clamp((100 - topic.score) * 0.7 + (readiness.risk === 'high' ? 15 : 0), 0, 100);
      return {
        id: `weak-topic-${topic.entityId}`,
        type: 'revisionSession',
        title: `Review ${topic.entityType} ${topic.entityId}`,
        confidence: this.mapConfidence(topic.confidenceLabel),
        priority: Math.round(priority),
        estimatedDurationMinutes: this.config.durationMinutes.revisionSession,
        reason: `Lower mastery detected in ${topic.entityType} ${topic.entityId}.`
          + ` Improving this area will increase readiness and reduce risk.`,
        relatedMasteryGap: clamp(100 - topic.score),
        relatedReadinessImpact: clamp(100 - readiness.readinessScore),
        source: 'weakTopic',
        signals: [
          { name: 'masteryScore', value: topic.score },
          { name: 'confidenceLabel', value: topic.confidenceLabel },
        ],
        expectedImprovement: 'Targeted review will close the gap and raise readiness for upcoming assessments.',
        referenceEntityId: topic.entityId,
      };
    });
  }

  private recommendFromReadiness(studentId: string, readiness: ReadinessResult): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (readiness.risk === 'high') {
      recommendations.push({
        id: `readiness-gap-${readiness.entityId}`,
        type: 'moduleReview',
        title: 'Focus on readiness gaps',
        confidence: 'High',
        priority: 90,
        estimatedDurationMinutes: this.config.durationMinutes.moduleReview,
        reason: 'Overall readiness is low, so a broader review will help stabilize performance.',
        relatedMasteryGap: 100 - readiness.readinessScore,
        relatedReadinessImpact: 100 - readiness.readinessScore,
        source: 'readinessGap',
        signals: [
          { name: 'readinessScore', value: readiness.readinessScore },
          { name: 'risk', value: readiness.risk },
        ],
        expectedImprovement: 'Reviewing weak modules can quickly improve readiness ahead of the next exam.',
      });
    }

    if (readiness.confidence === 'High' && readiness.risk === 'low') {
      recommendations.push({
        id: `readiness-maintain-${readiness.entityId}`,
        type: 'aiTutor',
        title: 'Maintain strong readiness with focused practice',
        confidence: 'High',
        priority: 85,
        estimatedDurationMinutes: this.config.durationMinutes.aiTutor,
        reason: 'Strong readiness means the student can benefit from high-confidence practice to keep momentum.',
        relatedMasteryGap: Math.max(0, 100 - readiness.readinessScore),
        relatedReadinessImpact: 20,
        source: 'readinessGap',
        signals: [
          { name: 'readinessScore', value: readiness.readinessScore },
          { name: 'risk', value: readiness.risk },
          { name: 'confidence', value: readiness.confidence },
        ],
        expectedImprovement: 'Focused AI tutor practice preserves readiness and builds confidence for the next assessment.',
      });
    }

    if (readiness.weakestAreas.length && readiness.weakestAreas.length <= 2) {
      recommendations.push({
        id: `next-lesson-${readiness.weakestAreas.join('-')}`,
        type: 'nextLesson',
        title: `Practice weak areas: ${readiness.weakestAreas.join(', ')}`,
        confidence: 'Moderate',
        priority: 75,
        estimatedDurationMinutes: this.config.durationMinutes.nextLesson,
        reason: 'Weakest topics are identified by readiness and should be practiced next.',
        relatedMasteryGap: 100 - readiness.readinessScore,
        relatedReadinessImpact: 40,
        source: 'readinessGap',
        signals: [
          { name: 'weakestAreas', value: readiness.weakestAreas.join(', ') },
        ],
        expectedImprovement: 'Practicing these topics will reduce the largest readiness gaps.',
      });
    }

    return recommendations;
  }

  private recommendFromPlanner(studentId: string, plan: { dailyPlans: Array<{ items: Array<{ id: string; referenceEntityId?: string; type: string; priority?: number }> }> }, readiness: ReadinessResult): Recommendation[] {
    const itemMap = new Map<string, Recommendation>();
    for (const day of plan.dailyPlans) {
      for (const item of day.items) {
        const id = item.referenceEntityId ?? item.id;
        const existing = itemMap.get(id);
        const priority = clamp(50 + (readiness.risk === 'high' ? 10 : 0), 0, 100);
        if (!existing) {
          itemMap.set(id, {
            id: `planner-${id}`,
            type: item.type === 'topic' ? 'nextLesson' : 'practiceQuestions',
            title: `Continue ${item.type} ${id}`,
            confidence: 'Moderate',
            priority,
            estimatedDurationMinutes: this.config.durationMinutes.nextLesson,
            reason: `Planner suggests this item based on recent weak mastery and schedule priorities.`,
            relatedMasteryGap: clamp(100 - readiness.readinessScore),
            relatedReadinessImpact: 30,
            source: 'planner',
            signals: [
              { name: 'plannerItemType', value: item.type },
              { name: 'itemPriority', value: item.priority ?? 0 },
            ],
            expectedImprovement: 'Following planner recommendations keeps study on track and improves consistency.',
            referenceEntityId: id,
          });
        }
      }
    }
    return Array.from(itemMap.values());
  }

  private recommendFromMasteryTrends(studentId: string, weakTopics: MasteryResult[]): Recommendation[] {
    return weakTopics
      .filter((topic) => topic.trend === 'declining')
      .slice(0, 2)
      .map((topic) => ({
        id: `mastery-trend-${topic.entityId}`,
        type: 'practiceQuestions',
        title: `Practice ${topic.entityType} ${topic.entityId}`,
        confidence: 'High',
        priority: clamp(80 + (100 - topic.score) * 0.2, 0, 100),
        estimatedDurationMinutes: this.config.durationMinutes.practiceQuestions,
        reason: 'Mastery score is declining on this topic, so targeted practice can reverse the trend.',
        relatedMasteryGap: clamp(100 - topic.score),
        relatedReadinessImpact: 35,
        source: 'masteryTrend',
        signals: [
          { name: 'trend', value: topic.trend },
          { name: 'masteryScore', value: topic.score },
        ],
        expectedImprovement: 'Targeted practice will stabilize mastery and prevent further decline.',
        referenceEntityId: topic.entityId,
      }));
  }

  private async recommendFromPrerequisites(studentId: string, weakTopics: MasteryResult[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    for (const topic of weakTopics.slice(0, 3)) {
      const node = await this.kg.getNode(topic.entityId);
      if (!node) continue;
      const prerequisites = await this.kg.getNeighbors(node.id, 'prerequisite');
      for (const prereq of prerequisites) {
        recommendations.push({
          id: `prereq-${topic.entityId}-${prereq.id}`,
          type: 'nextLesson',
          title: `Review prerequisite ${prereq.title}`,
          confidence: 'Moderate',
          priority: 70,
          estimatedDurationMinutes: this.config.durationMinutes.nextLesson,
          reason: `Prerequisite knowledge for ${topic.entityId} is important for mastery.`,
          relatedMasteryGap: clamp(100 - topic.score),
          relatedReadinessImpact: 20,
          source: 'prerequisite',
          signals: [
            { name: 'prerequisite', value: prereq.title },
          ],
          expectedImprovement: 'Strengthening prerequisite concepts makes future learning easier.',
          referenceEntityId: prereq.id,
        });
      }
    }
    return recommendations;
  }

  private recommendFromMockPerformance(studentId: string, readiness: ReadinessResult): Recommendation[] {
    if (readiness.details.mockExamScore >= 70) return [];
    return [{
      id: 'mock-test-review',
      type: 'mockTest',
      title: 'Retake a mock test',
      confidence: readiness.details.mockExamScore > 0 ? 'Moderate' : 'Low',
      priority: clamp(80 - readiness.details.mockExamScore * 0.5, 0, 100),
      estimatedDurationMinutes: this.config.durationMinutes.mockTest,
      reason: 'Mock exam performance is below target, so a follow-up mock will improve exam readiness.',
      relatedMasteryGap: clamp(100 - readiness.details.mockExamScore),
      relatedReadinessImpact: clamp(100 - readiness.readinessScore),
      source: 'mockPerformance',
      signals: [
        { name: 'mockExamScore', value: readiness.details.mockExamScore },
      ],
      expectedImprovement: 'Retaking a mock test reveals weak areas and builds confidence for the exam.',
    }];
  }

  private recommendFromStrongPerformance(studentId: string, overallMastery: MasteryResult, readiness: ReadinessResult): Recommendation[] {
    if (overallMastery.score < 75 || readiness.risk !== 'low') return [];

    return [{
      id: `strong-performance-${studentId}`,
      type: 'aiTutor',
      title: 'Keep strong performance with targeted practice',
      confidence: 'High',
      priority: clamp(80 + (overallMastery.score - 75) * 0.3, 0, 100),
      estimatedDurationMinutes: this.config.durationMinutes.aiTutor,
      reason: 'Student performance is strong, so a high-confidence session helps maintain momentum and consolidate mastery.',
      relatedMasteryGap: clamp(100 - overallMastery.score),
      relatedReadinessImpact: 15,
      source: 'readinessGap',
      signals: [
        { name: 'overallMastery', value: overallMastery.score },
        { name: 'readinessScore', value: readiness.readinessScore },
      ],
      expectedImprovement: 'A focused AI tutor session keeps progress steady and reinforces high-performing topics.',
    }];
  }

  private recommendFromStrongSignals(studentId: string, summary: Record<string, number>, readiness: ReadinessResult): Recommendation[] {
    const answered = summary['answered'] ?? 0;
    const correctAnswered = summary['correctAnswered'] ?? 0;
    const mockScore = summary['mockPerformanceScore'] ?? 0;
    const accuracy = answered ? (correctAnswered / answered) : 0;

    if (answered >= 1 && accuracy >= 0.8 && mockScore >= 85) {
      return [{
        id: `strong-signal-${studentId}`,
        type: 'aiTutor',
        title: 'Advance with high-confidence AI practice',
        confidence: 'High',
        priority: clamp(85 + mockScore * 0.1, 0, 100),
        estimatedDurationMinutes: this.config.durationMinutes.aiTutor,
        reason: 'Strong recent performance and mock exam success support a high-confidence AI tutor session.',
        relatedMasteryGap: clamp(100 - readiness.readinessScore),
        relatedReadinessImpact: 20,
        source: 'recentActivity',
        signals: [
          { name: 'answered', value: answered },
          { name: 'correctAnswered', value: correctAnswered },
          { name: 'mockPerformanceScore', value: mockScore },
        ],
        expectedImprovement: 'This session preserves strong momentum and reinforces current mastery.',
        referenceEntityId: studentId,
      }];
    }

    return [];
  }

  private recommendFromRecentActivity(studentId: string, summary: Record<string, number>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const reviewPriority = summary['answered'] ? 60 : 40;
    if (summary['answered'] && summary['answered'] < 5) {
      recommendations.push({
        id: 'recent-activity-review',
        type: 'aiTutor',
        title: 'Continue recent activity with AI tutor',
        confidence: 'Moderate',
        priority: reviewPriority,
        estimatedDurationMinutes: this.config.durationMinutes.aiTutor,
        reason: 'Recent engagement is low, so an AI tutor session will help maintain momentum.',
        relatedMasteryGap: 20,
        relatedReadinessImpact: 15,
        source: 'recentActivity',
        signals: [
          { name: 'answeredActivity', value: summary['answered'] ?? 0 },
        ],
        expectedImprovement: 'Engaging with AI tutoring keeps the student on track and improves focus.',
      });
    }
    return recommendations;
  }

  private async buildRecommendationContext(studentId: string, input?: RecommendationInput, initialContext?: Partial<RecommendationRequestContext>): Promise<RecommendationRequestContext> {
    return timeAsync('recommendation', 'load_profile', async () => {
      const date = input?.currentDate ?? new Date().toISOString().slice(0, 10);
      const examDate = input?.examDate;
      const masteryContext = initialContext?.masteryContext ?? await this.mastery.createRequestContext(studentId);

      const context: RecommendationRequestContext = {
        studentId,
        currentDate: date,
        examDate,
        masteryContext,
        weakTopics: initialContext?.weakTopics,
        overallMastery: initialContext?.overallMastery,
        readiness: initialContext?.readiness,
        plannerItems: initialContext?.plannerItems,
        recentSignals: initialContext?.recentSignals,
        signalSummary: initialContext?.signalSummary,
      };

      const [weakTopics, overallMastery, readiness, plannerItems, recentSignals] = await Promise.all([
        timeAsync('recommendation', 'load_weak_topics', async () => this.findWeakTopics(studentId, context)),
        timeAsync('recommendation', 'load_overall_mastery', async () => context.overallMastery ?? this.mastery.getOverallMastery(studentId, masteryContext)),
        timeAsync('recommendation', 'load_readiness', async () => context.readiness ?? this.readiness.getOverallReadiness(studentId, { currentDate: date, examDate }, masteryContext)),
        timeAsync('recommendation', 'load_planner_items', async () => context.plannerItems ?? this.planner.generateWeeklyPlan(studentId, { currentDate: date }, masteryContext)),
        timeAsync('recommendation', 'load_recent_signals', async () => context.recentSignals ? Promise.resolve(context.recentSignals) : this.getRecentSignals(studentId, this.config.recentActivityDays, context)),
      ]);

      context.weakTopics = weakTopics;
      context.overallMastery = overallMastery;
      context.readiness = readiness;
      context.plannerItems = plannerItems;
      context.recentSignals = recentSignals;
      context.signalSummary = context.signalSummary ?? this.summarizeSignals(recentSignals);
      logger.info('recommendation.load_profile.complete', {
        weakTopics: weakTopics.length,
        plannerItemCount: plannerItems.dailyPlans.flatMap((plan) => plan.items).length,
        signalCount: recentSignals.length,
      });
      return context;
    });
  }

  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Map<string, Recommendation>();
    for (const recommendation of recommendations) {
      const key = recommendation.referenceEntityId ?? recommendation.id;
      const existing = seen.get(key);
      if (!existing || recommendation.priority > existing.priority) {
        seen.set(key, recommendation);
      }
    }
    return recommendations
      .filter((item) => {
        const key = item.referenceEntityId ?? item.id;
        return seen.get(key) === item;
      })
      .map((item) => ({ ...item }));
  }

  private rankRecommendations(
    recommendations: Recommendation[],
    overallMastery: MasteryResult,
    readiness: ReadinessResult,
    weakTopics: MasteryResult[],
    examDate?: string,
  ): Recommendation[] {
    const examUrgency = this.calculateExamUrgency(examDate);
    return recommendations
      .map((recommendation) => ({
        ...recommendation,
        priority: clamp(
          recommendation.priority * 0.5 +
            this.config.weights.masteryGap * recommendation.relatedMasteryGap +
            this.config.weights.readinessImpact * recommendation.relatedReadinessImpact +
            this.config.weights.examRelevance * examUrgency +
            this.config.weights.prerequisiteImportance * (recommendation.source === 'prerequisite' ? 20 : 0) +
            this.config.weights.recency * (recommendation.signals.find((signal) => signal.name === 'answeredActivity')?.value as number || 0) +
            this.config.weights.engagement * (recommendation.source === 'recentActivity' ? 10 : 0),
          0,
          100,
        ),
      }))
      .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
  }

  private calculateExamUrgency(examDate?: string): number {
    if (!examDate) return 0;
    const diffDays = Math.max(0, Math.ceil((Date.parse(examDate) - Date.now()) / (1000 * 60 * 60 * 24)));
    if (diffDays <= 7) return 100;
    if (diffDays <= 21) return 60;
    return 20;
  }

  private mapConfidence(label: string): RecommendationConfidence {
    if (label === 'high') return 'High';
    if (label === 'medium') return 'Moderate';
    return 'Low';
  }

  private topRecommendationSources(recommendations: Recommendation[]) {
    const counts = new Map<RecommendationSource, number>();
    for (const recommendation of recommendations) {
      counts.set(recommendation.source, (counts.get(recommendation.source) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([source]) => source);
  }
}

export const recommendationService = new RecommendationService();
