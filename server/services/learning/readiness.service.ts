import { knowledgeGraphService } from './knowledge-graph.service';
import { MasteryService, type MasteryRequestContext } from './mastery.service';
import { StudyPlannerService } from './study-planner.service';
import type {
  ReadinessConfig,
  ReadinessInput,
  ReadinessResult,
  ReadinessWeightConfig,
  ReadinessRiskThresholds,
  ReadinessConfidence,
  ReadinessRisk,
  ReadinessAction,
} from '@/types/learning';
import type { KnowledgeGraphService } from './knowledge-graph.service';

const defaultWeights: ReadinessWeightConfig = {
  mastery: 0.35,
  mockPerformance: 0.3,
  completion: 0.1,
  revisionCoverage: 0.1,
  consistency: 0.05,
  recency: 0.05,
  plannerProgress: 0.05,
};

const defaultRiskThresholds: ReadinessRiskThresholds = {
  high: 80,
  medium: 60,
};

const defaultConfig: ReadinessConfig = {
  weights: defaultWeights,
  riskThresholds: defaultRiskThresholds,
  recentWindowDays: 14,
  priorWindowDays: 14,
  examUrgencyDays: { critical: 7, near: 21 },
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function confidenceLabel(score: number): ReadinessConfidence {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

function riskLabel(score: number, thresholds: ReadinessRiskThresholds): ReadinessRisk {
  if (score < thresholds.medium) return 'high';
  if (score < thresholds.high) return 'medium';
  return 'low';
}

export class ReadinessService {
  private config: ReadinessConfig;
  private kg: KnowledgeGraphService;
  private mastery: MasteryService;
  private planner: StudyPlannerService;

  constructor(
    config?: Partial<ReadinessConfig>,
    kg?: KnowledgeGraphService,
    mastery?: MasteryService,
    planner?: StudyPlannerService,
  ) {
    this.config = {
      ...defaultConfig,
      ...(config ?? {}),
      weights: {
        ...defaultConfig.weights,
        ...(config?.weights ?? {}),
      },
    };
    this.kg = kg ?? knowledgeGraphService;
    this.mastery = mastery ?? new MasteryService(undefined, this.kg);
    this.planner = planner ?? new StudyPlannerService(undefined, this.kg, this.mastery);
  }

  async getOverallReadiness(studentId: string, input?: ReadinessInput, masteryContext?: MasteryRequestContext): Promise<ReadinessResult> {
    const examDate = input?.examDate;
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const overallMastery = await this.mastery.getOverallMastery(studentId, requestContext);
    const mockScore = await this.getRecentMockScore(studentId, requestContext);
    const completionScore = await this.estimateCompletionScore(studentId, undefined, undefined, requestContext);
    const revisionCoverage = await this.estimateRevisionCoverage(studentId, undefined, undefined, requestContext);
    const consistencyScore = await this.estimateStudyConsistency(studentId, undefined, undefined, requestContext);
    const recencyScore = await this.estimateRecency(studentId, undefined, undefined, requestContext);
    const plannerProgress = await this.estimatePlannerProgress(studentId, undefined, undefined, requestContext);
    const examDaysRemaining = this.calculateDaysRemaining(examDate, input?.currentDate);

    const readinessScore = this.combineReadinessScores({
      mastery: overallMastery.score,
      mockPerformance: mockScore,
      completion: completionScore,
      revisionCoverage,
      consistency: consistencyScore,
      recency: recencyScore,
      plannerProgress,
    });

    const trend = await this.calculateTrend(studentId, readinessScore);
    const strong = await this.findStrongTopics(studentId, 3);
    const weak = await this.findWeakTopics(studentId, 3);
    const actions = this.buildActions({
      score: readinessScore,
      strongTopics: strong,
      weakTopics: weak,
      mockExam: mockScore,
      completionScore,
      revisionCoverage,
      examDaysRemaining,
    });

    return {
      entityId: studentId,
      entityType: 'overall',
      readinessScore,
      confidence: confidenceLabel(readinessScore),
      trend,
      risk: riskLabel(readinessScore, this.config.riskThresholds),
      strongestAreas: strong,
      weakestAreas: weak,
      recommendedActions: actions,
      details: {
        masteryScore: overallMastery.score,
        mockExamScore: mockScore,
        completionScore,
        revisionCoverage,
        consistencyScore,
        recencyScore,
        plannerProgress,
        examDate,
        examDaysRemaining,
      },
    };
  }

  async getModuleReadiness(studentId: string, moduleId: string, input?: ReadinessInput, masteryContext?: MasteryRequestContext): Promise<ReadinessResult> {
    const examDate = input?.examDate;
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const moduleMastery = await this.mastery.getModuleMastery(studentId, moduleId, requestContext);
    const mockScore = await this.getRecentMockScore(studentId, requestContext);
    const completionScore = await this.estimateCompletionScore(studentId, moduleId, undefined, requestContext);
    const revisionCoverage = await this.estimateRevisionCoverage(studentId, moduleId, undefined, requestContext);
    const consistencyScore = await this.estimateStudyConsistency(studentId, moduleId, undefined, requestContext);
    const recencyScore = await this.estimateRecency(studentId, moduleId, undefined, requestContext);
    const examDaysRemaining = this.calculateDaysRemaining(examDate, input?.currentDate);

    const plannerProgress = await this.estimatePlannerProgress(studentId, moduleId, undefined, requestContext);
    const readinessScore = this.combineReadinessScores({
      mastery: moduleMastery.score,
      mockPerformance: mockScore,
      completion: completionScore,
      revisionCoverage,
      consistency: consistencyScore,
      recency: recencyScore,
      plannerProgress,
    });

    const trend = await this.calculateTrend(studentId, readinessScore, moduleId);
    const strong = await this.findStrongTopics(studentId, 3, moduleId);
    const weak = await this.findWeakTopics(studentId, 3, moduleId);
    const actions = this.buildActions({
      score: readinessScore,
      strongTopics: strong,
      weakTopics: weak,
      mockExam: mockScore,
      completionScore,
      revisionCoverage,
      examDaysRemaining,
      contextLabel: `module ${moduleId}`,
    });

    return {
      entityId: moduleId,
      entityType: 'module',
      readinessScore,
      confidence: confidenceLabel(readinessScore),
      trend,
      risk: riskLabel(readinessScore, this.config.riskThresholds),
      strongestAreas: strong,
      weakestAreas: weak,
      recommendedActions: actions,
      details: {
        masteryScore: moduleMastery.score,
        mockExamScore: mockScore,
        completionScore,
        revisionCoverage,
        consistencyScore,
        recencyScore,
        plannerProgress,
        examDate,
        examDaysRemaining,
      },
    };
  }

  async getTopicReadiness(studentId: string, topicId: string, input?: ReadinessInput, masteryContext?: MasteryRequestContext): Promise<ReadinessResult> {
    const examDate = input?.examDate;
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const topicMastery = await this.mastery.getTopicMastery(studentId, topicId, requestContext);
    const mockScore = await this.getRecentMockScore(studentId, requestContext);
    const completionScore = await this.estimateCompletionScore(studentId, undefined, topicId, requestContext);
    const revisionCoverage = await this.estimateRevisionCoverage(studentId, undefined, topicId, requestContext);
    const consistencyScore = await this.estimateStudyConsistency(studentId, undefined, topicId, requestContext);
    const recencyScore = await this.estimateRecency(studentId, undefined, topicId, requestContext);
    const examDaysRemaining = this.calculateDaysRemaining(examDate, input?.currentDate);

    const plannerProgress = await this.estimatePlannerProgress(studentId, undefined, topicId, requestContext);
    const readinessScore = this.combineReadinessScores({
      mastery: topicMastery.score,
      mockPerformance: mockScore,
      completion: completionScore,
      revisionCoverage,
      consistency: consistencyScore,
      recency: recencyScore,
      plannerProgress,
    });

    const trend = await this.calculateTrend(studentId, readinessScore, topicId);
    const strong = await this.findStrongTopics(studentId, 3, undefined, topicId);
    const weak = await this.findWeakTopics(studentId, 3, undefined, topicId);
    const actions = this.buildActions({
      score: readinessScore,
      strongTopics: strong,
      weakTopics: weak,
      mockExam: mockScore,
      completionScore,
      revisionCoverage,
      examDaysRemaining,
      contextLabel: `topic ${topicId}`,
    });

    return {
      entityId: topicId,
      entityType: 'topic',
      readinessScore,
      confidence: confidenceLabel(readinessScore),
      trend,
      risk: riskLabel(readinessScore, this.config.riskThresholds),
      strongestAreas: strong,
      weakestAreas: weak,
      recommendedActions: actions,
      details: {
        masteryScore: topicMastery.score,
        mockExamScore: mockScore,
        completionScore,
        revisionCoverage,
        consistencyScore,
        recencyScore,
        plannerProgress,
        examDate,
        examDaysRemaining,
      },
    };
  }

  async getBulkReadiness(studentId: string, topicIds: string[]): Promise<ReadinessResult[]> {
    const requestContext = await this.mastery.createRequestContext(studentId);
    const results = await Promise.all(topicIds.map((topicId) => this.getTopicReadiness(studentId, topicId, undefined, requestContext)));
    return results;
  }

  private combineReadinessScores(scores: Record<keyof ReadinessWeightConfig, number>) {
    const weighted = Object.entries(scores).reduce((sum, [key, value]) => {
      const weight = this.config.weights[key as keyof ReadinessWeightConfig];
      return sum + value * weight;
    }, 0);
    return clamp(weighted);
  }

  private async getRecentMockScore(studentId: string, context?: MasteryRequestContext) {
    const graph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    const scores: number[] = [];
    for (const node of Object.values(graph.nodes)) {
      for (const signal of node.signals) {
        if (signal.kind === 'mockPerformance' && signal.maxScore) {
          scores.push((signal.score / signal.maxScore) * 100);
        }
      }
    }
    return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  private async estimatePlannerProgress(studentId: string, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const plan = await this.planner.generateWeeklyPlan(studentId, { currentDate: isoDate(new Date()) }, context);
    if (!plan.dailyPlans.length) return 0;
    const completed = plan.dailyPlans.flatMap((day) => day.items).filter((item) => item.type !== 'catchup').length;
    const total = plan.dailyPlans.flatMap((day) => day.items).length || 1;
    return clamp((completed / total) * 100);
  }

  private async estimateCompletionScore(studentId: string, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const graph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    const nodes = context?.allNodes ?? await this.kg.listNodes();
    const relevantLessons = nodes.filter((node) => {
      if (node.type !== 'lesson') return false;
      if (moduleId && !node.id.startsWith(moduleId)) return false;
      if (topicId && node.id !== topicId && !node.id.startsWith(topicId)) return false;
      return true;
    });
    if (!relevantLessons.length) return 0;
    const completedLessons = relevantLessons.filter((lesson) =>
      (graph.nodes[lesson.id]?.signals ?? []).some((signal) =>
        ['completed', 'answered', 'viewed'].includes(signal.kind),
      ),
    ).length;
    return clamp((completedLessons / relevantLessons.length) * 100);
  }

  private async estimateRevisionCoverage(studentId: string, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const graph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    const nodes = context?.allNodes ?? await this.kg.listNodes();
    const relevantLessons = nodes.filter((node) => {
      if (node.type !== 'lesson') return false;
      if (moduleId && !node.id.startsWith(moduleId)) return false;
      if (topicId && node.id !== topicId && !node.id.startsWith(topicId)) return false;
      return true;
    });
    if (!relevantLessons.length) return 0;
    const revisedLessons = relevantLessons.filter((lesson) =>
      (graph.nodes[lesson.id]?.signals ?? []).some((signal) => signal.kind === 'completed' || signal.kind === 'viewed'),
    ).length;
    return clamp((revisedLessons / relevantLessons.length) * 100);
  }

  private async estimateStudyConsistency(studentId: string, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const graph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    const daySet = new Set<string>();
    for (const node of Object.values(graph.nodes)) {
      const relevantSignals = node.signals.filter((signal) => {
        if (moduleId && !node.nodeId.startsWith(moduleId)) return false;
        if (topicId && node.nodeId !== topicId && !node.nodeId.startsWith(topicId)) return false;
        return ['timeSpent', 'answered', 'completed', 'viewed'].includes(signal.kind);
      });
      for (const signal of relevantSignals) {
        daySet.add(isoDate(new Date(signal.timestamp)));
      }
    }
    const recentDays = Math.min(daySet.size, this.config.recentWindowDays);
    return clamp((recentDays / this.config.recentWindowDays) * 100);
  }

  private async estimateRecency(studentId: string, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const graph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    let lastTimestamp = 0;
    for (const node of Object.values(graph.nodes)) {
      const relevant = node.signals.some((signal) => {
        if (moduleId && !node.nodeId.startsWith(moduleId)) return false;
        if (topicId && node.nodeId !== topicId && !node.nodeId.startsWith(topicId)) return false;
        return ['answered', 'completed', 'viewed', 'timeSpent', 'mockPerformance'].includes(signal.kind);
      });
      if (!relevant) continue;
      for (const signal of node.signals) {
        lastTimestamp = Math.max(lastTimestamp, signal.timestamp);
      }
    }
    if (!lastTimestamp) return 0;
    const daysSince = (Date.now() - lastTimestamp) / (1000 * 60 * 60 * 24);
    return clamp(100 - (daysSince / this.config.recentWindowDays) * 100);
  }

  private async getEntityNodeCount(moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const nodes = context?.allNodes ?? await this.kg.listNodes();
    return nodes.filter((node) => {
      if (moduleId && node.id.startsWith(moduleId)) return true;
      if (topicId && (node.id === topicId || node.id.startsWith(topicId))) return true;
      if (!moduleId && !topicId) return true;
      return false;
    }).length;
  }

  private async calculateTrend(_studentId: string, currentScore: number, _scopeId?: string) {
    const snapshot = await this.getHistoricalReadiness(_studentId, _scopeId);
    if (snapshot === null) return 'stable';
    if (currentScore >= snapshot + 5) return 'improving';
    if (snapshot >= currentScore + 5) return 'declining';
    return 'stable';
  }

  private async getHistoricalReadiness(_studentId: string, _scopeId?: string) {
    void _studentId;
    void _scopeId;
    return null;
  }

  private async findStrongTopics(studentId: string, limit: number, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const allTopics = await this.kg.listNodes({ type: 'topic' });
    const masteryScores = await Promise.all(
      allTopics
        .filter((topic) => {
          if (moduleId && !topic.id.startsWith(moduleId)) return false;
          if (topicId && topic.id !== topicId) return false;
          return true;
        })
        .map((topic) => this.mastery.getTopicMastery(studentId, topic.id, context)),
    );
    return masteryScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => `Topic ${item.entityId}`);
  }

  private async findWeakTopics(studentId: string, limit: number, moduleId?: string, topicId?: string, context?: MasteryRequestContext) {
    const allTopics = await this.kg.listNodes({ type: 'topic' });
    const masteryScores = await Promise.all(
      allTopics
        .filter((topic) => {
          if (moduleId && !topic.id.startsWith(moduleId)) return false;
          if (topicId && topic.id !== topicId) return false;
          return true;
        })
        .map((topic) => this.mastery.getTopicMastery(studentId, topic.id, context)),
    );
    return masteryScores
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((item) => `Topic ${item.entityId}`);
  }

  private buildActions(options: {
    score: number;
    strongTopics: string[];
    weakTopics: string[];
    mockExam: number;
    completionScore: number;
    revisionCoverage: number;
    examDaysRemaining?: number | null;
    contextLabel?: string;
  }) {
    const actions: ReadinessAction[] = [];
    const label = options.contextLabel ? `${options.contextLabel}` : 'your course';

    if (options.weakTopics.length) {
      actions.push({
        action: `Revise ${options.weakTopics[0]}`,
        reason: `This topic is among the weakest areas with low mastery and will improve overall readiness.`,
      });
    }

    if (options.completionScore < 70) {
      actions.push({
        action: 'Complete more lessons',
        reason: `Lesson completion is below 70% in ${label}, which limits your readiness score.`,
      });
    }

    if (options.mockExam < 70) {
      actions.push({
        action: 'Attempt another mock exam',
        reason: `Mock performance is weak, so practicing exam-like questions will raise confidence.`,
      });
    }

    if (options.revisionCoverage < 60) {
      actions.push({
        action: 'Review recent revision topics',
        reason: `Revision coverage is low and your readiness depends on reinforcing learned material.`,
      });
    }

    if (options.examDaysRemaining !== null && options.examDaysRemaining !== undefined) {
      if (options.examDaysRemaining <= this.config.examUrgencyDays.critical) {
        actions.push({
          action: 'Increase focused study time',
          reason: `Exam is within ${options.examDaysRemaining} days, so prioritize high-risk topics now.`,
        });
      } else if (options.examDaysRemaining <= this.config.examUrgencyDays.near) {
        actions.push({
          action: 'Start exam review cycle',
          reason: `Exam date is approaching, so begin systematic review of key topics.`,
        });
      }
    }

    if (!actions.length) {
      actions.push({
        action: 'Continue consistent study',
        reason: 'You are on track, keep reviewing strong areas and reinforcing weak topics.',
      });
    }

    return actions;
  }

  private calculateDaysRemaining(examDate?: string, currentDate?: string) {
    if (!examDate) return null;
    const now = currentDate ? new Date(currentDate) : new Date();
    const exam = new Date(examDate);
    return Math.max(0, Math.round((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }
}

export const readinessService = new ReadinessService();
