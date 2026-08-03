import { knowledgeGraphService } from './knowledge-graph.service';
import type { KnowledgeGraphService } from './knowledge-graph.service';
import type {
  MasteryConfig,
  MasteryEntityType,
  MasteryResult,
  MasteryScoreBreakdown,
  MasteryWeightConfig,
  StudentGraphState,
  StudentSignal,
  GraphNode,
  GraphEdge,
  ConfidenceLabel,
  TrendLabel,
} from '@/types/learning';

const defaultWeights: MasteryWeightConfig = {
  questionCorrectness: 0.35,
  mockPerformance: 0.25,
  lessonCompletion: 0.15,
  revisionFrequency: 0.10,
  studyTime: 0.10,
  aiInteraction: 0.05,
};

const defaultConfig: MasteryConfig = {
  weights: defaultWeights,
  expectedStudyMinutes: 120,
  expectedRevisionCount: 3,
  expectedAITutorInteractions: 2,
  recentWindowDays: 14,
  priorWindowDays: 14,
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const sumWeights = (weights: MasteryWeightConfig) =>
  Object.values(weights).reduce((sum, weight) => sum + weight, 0);

const nowMs = () => Date.now();

export interface MasteryRequestContext {
  studentGraph: StudentGraphState
  allNodes: GraphNode[]
  entityGraphCache: Map<string, GraphNode[]>
  edgeCache: Map<string, GraphEdge[]>
}

interface SignalSummary {
  totalSignals: number;
  distinctSignalKinds: Set<string>;
  lastTimestamp: number | null;
  answeredCount: number;
  correctAnswers: number;
  lessonCompletions: number;
  lessonViews: number;
  revisionEvents: number;
  timeSpentSeconds: number;
  mockScoreTotal: number;
  mockMaxTotal: number;
  aiInteractionCount: number;
  aiInteractionSeconds: number;
}

export class MasteryService {
  private config: MasteryConfig;
  private kg: KnowledgeGraphService;

  constructor(config?: Partial<MasteryConfig>, kg?: KnowledgeGraphService) {
    this.config = { ...defaultConfig, ...(config ?? {}) };
    this.kg = kg ?? knowledgeGraphService;

    if (this.config.weights) {
      const totalWeight = sumWeights(this.config.weights);
      if (totalWeight !== 1) {
        const normalized: any = {};
        for (const [key, value] of Object.entries(this.config.weights)) {
          normalized[key] = value / totalWeight;
        }
        this.config.weights = normalized as MasteryWeightConfig;
      }
    }
  }

  async getTopicMastery(studentId: string, topicId: string, context?: MasteryRequestContext): Promise<MasteryResult> {
    return this.computeMastery(studentId, topicId, 'topic', context);
  }

  async getLessonMastery(studentId: string, lessonId: string, context?: MasteryRequestContext): Promise<MasteryResult> {
    return this.computeMastery(studentId, lessonId, 'lesson', context);
  }

  async getModuleMastery(studentId: string, moduleId: string, context?: MasteryRequestContext): Promise<MasteryResult> {
    return this.computeMastery(studentId, moduleId, 'module', context);
  }

  async getOverallMastery(studentId: string, context?: MasteryRequestContext): Promise<MasteryResult> {
    return this.computeMastery(studentId, 'overall', 'overall', context);
  }

  async getBulkMastery(studentId: string, entityIds: string[], entityType: MasteryEntityType, context?: MasteryRequestContext) {
    const ids = Array.from(new Set(entityIds));
    if (!ids.length) return [];
    const requestContext = context ?? await this.createRequestContext(studentId);
    const results = await Promise.all(ids.map((id) => this.computeMastery(studentId, id, entityType, requestContext)));
    return results;
  }

  async createRequestContext(studentId: string): Promise<MasteryRequestContext> {
    const [studentGraph, allNodes] = await Promise.all([
      this.kg.getStudentGraph(studentId),
      this.kg.listNodes(),
    ]);

    return {
      studentGraph,
      allNodes,
      entityGraphCache: new Map(),
      edgeCache: new Map(),
    };
  }

  private async computeMastery(
    studentId: string,
    entityId: string,
    entityType: MasteryEntityType,
    context?: MasteryRequestContext,
  ): Promise<MasteryResult> {
    const allNodes = entityType === 'overall'
      ? context?.allNodes ?? await this.kg.listNodes()
      : await this.resolveEntityGraph(entityId, context);
    const studentGraph = context?.studentGraph ?? await this.kg.getStudentGraph(studentId);
    const nodeIds = new Set(allNodes.map((node) => node.id));
    const summary = this.summarizeSignals(studentGraph, nodeIds);
    const contributions = this.scoreContributions(summary, allNodes);
    const score = this.combineScores(contributions);
    const trend = this.calculateTrend(studentGraph, nodeIds);
    const confidence = this.calculateConfidence(summary);
    return {
      entityId,
      entityType,
      score,
      confidenceLabel: confidence.label,
      confidenceScore: confidence.score,
      trend,
      lastUpdated: summary.lastTimestamp ?? nowMs(),
      contributions,
      recommendations: this.buildRecommendations(contributions),
    };
  }

  private async resolveEntityGraph(entityId: string, context?: MasteryRequestContext): Promise<GraphNode[]> {
    if (context?.entityGraphCache.has(entityId)) {
      return context.entityGraphCache.get(entityId)!;
    }

    const root = await this.kg.getNode(entityId);
    if (!root) return [];
    const visited = new Map<string, GraphNode>();
    const queue: GraphNode[] = [root];
    visited.set(root.id, root);

    while (queue.length) {
      const current = queue.shift()!;
      const outgoing = await this.getEdges(current.id, 'source', context);
      const incoming = await this.getEdges(current.id, 'target', context);
      const related = [...outgoing, ...incoming].filter((edge) =>
        ['parent', 'related', 'dependsOn', 'prerequisite'].includes(edge.relation),
      );
      for (const edge of related) {
        const neighborId = edge.sourceId === current.id ? edge.targetId : edge.sourceId;
        if (!visited.has(neighborId)) {
          const node = await this.kg.getNode(neighborId);
          if (node) {
            visited.set(node.id, node);
            queue.push(node);
          }
        }
      }
    }

    const resolved = Array.from(visited.values());
    context?.entityGraphCache.set(entityId, resolved);
    return resolved;
  }

  private async getEdges(nodeId: string, direction: 'source' | 'target', context?: MasteryRequestContext): Promise<GraphEdge[]> {
    const cacheKey = `${direction}:${nodeId}`;
    if (context?.edgeCache.has(cacheKey)) {
      return context.edgeCache.get(cacheKey)!;
    }

    const edges = direction === 'source'
      ? await this.kg.listEdges({ sourceId: nodeId } as any)
      : await this.kg.listEdges({ targetId: nodeId } as any);

    context?.edgeCache.set(cacheKey, edges);
    return edges;
  }

  private summarizeSignals(studentGraph: StudentGraphState, nodeIds: Set<string>): SignalSummary {
    const result: SignalSummary = {
      totalSignals: 0,
      distinctSignalKinds: new Set(),
      lastTimestamp: null,
      answeredCount: 0,
      correctAnswers: 0,
      lessonCompletions: 0,
      lessonViews: 0,
      revisionEvents: 0,
      timeSpentSeconds: 0,
      mockScoreTotal: 0,
      mockMaxTotal: 0,
      aiInteractionCount: 0,
      aiInteractionSeconds: 0,
    };

    for (const nodeId of nodeIds) {
      const state = studentGraph.nodes[nodeId];
      if (!state) continue;
      for (const signal of state.signals) {
        result.totalSignals += 1;
        result.distinctSignalKinds.add(signal.kind);
        result.lastTimestamp = Math.max(result.lastTimestamp ?? 0, signal.timestamp);

        if (signal.kind === 'answered') {
          result.answeredCount += 1;
          if (signal.correct) result.correctAnswers += 1;
        } else if (signal.kind === 'completed') {
          result.lessonCompletions += 1;
          result.revisionEvents += 1;
        } else if (signal.kind === 'viewed') {
          result.lessonViews += 1;
          result.revisionEvents += 1;
        } else if (signal.kind === 'timeSpent') {
          result.timeSpentSeconds += signal.seconds;
        } else if (signal.kind === 'mockPerformance') {
          result.mockScoreTotal += signal.score;
          result.mockMaxTotal += signal.maxScore;
        } else if (signal.kind === 'aiInteraction') {
          result.aiInteractionCount += 1;
          result.aiInteractionSeconds += signal.durationSeconds;
        }
      }
    }

    return result;
  }

  private scoreContributions(summary: SignalSummary, nodes: GraphNode[]) {
    const contributions: MasteryScoreBreakdown[] = [];
    const lessons = nodes.filter((node) => node.type === 'lesson');
    const completedLessons = lessons.length ? summary.lessonCompletions / lessons.length : 0;
    const revisionFrequency = clamp(summary.revisionEvents / (this.config.expectedRevisionCount || 1) / 1) * 100;
    const studyTimeMinutes = summary.timeSpentSeconds / 60;
    const studyTimeScore = clamp(studyTimeMinutes / (this.config.expectedStudyMinutes || 1) * 100);
    const questionCorrectness = summary.answeredCount ? (summary.correctAnswers / summary.answeredCount) * 100 : 0;
    const mockPerformance = summary.mockMaxTotal ? (summary.mockScoreTotal / summary.mockMaxTotal) * 100 : 0;
    const aiInteractionScore = clamp((summary.aiInteractionCount / (this.config.expectedAITutorInteractions || 1)) * 100);
    const lessonCompletionScore = clamp(completedLessons * 100);

    contributions.push({ label: 'Question correctness', type: 'questionCorrectness', score: questionCorrectness, weight: this.config.weights.questionCorrectness });
    contributions.push({ label: 'Mock performance', type: 'mockPerformance', score: mockPerformance, weight: this.config.weights.mockPerformance });
    contributions.push({ label: 'Lesson completion', type: 'lessonCompletion', score: lessonCompletionScore, weight: this.config.weights.lessonCompletion });
    contributions.push({ label: 'Revision frequency', type: 'revisionFrequency', score: revisionFrequency, weight: this.config.weights.revisionFrequency });
    contributions.push({ label: 'Study time', type: 'studyTime', score: studyTimeScore, weight: this.config.weights.studyTime });
    contributions.push({ label: 'AI tutor interactions', type: 'aiInteraction', score: aiInteractionScore, weight: this.config.weights.aiInteraction });

    return contributions;
  }

  private combineScores(contributions: MasteryScoreBreakdown[]) {
    const total = contributions.reduce((acc, next) => acc + next.score * next.weight, 0);
    return clamp(total, 0, 100);
  }

  private calculateTrend(studentGraph: StudentGraphState, nodeIds: Set<string>): TrendLabel {
    const now = nowMs();
    const recentStart = now - this.config.recentWindowDays * 24 * 60 * 60 * 1000;
    const priorStart = recentStart - this.config.priorWindowDays * 24 * 60 * 60 * 1000;
    const recentSignals = this.collectSignalsInRange(studentGraph, nodeIds, recentStart, now);
    const priorSignals = this.collectSignalsInRange(studentGraph, nodeIds, priorStart, recentStart);
    const recentScore = this.aggregateTrendScore(recentSignals);
    const priorScore = this.aggregateTrendScore(priorSignals);
    const threshold = 2;
    if (recentScore >= priorScore + threshold) return 'improving';
    if (priorScore >= recentScore + threshold) return 'declining';
    return 'stable';
  }

  private collectSignalsInRange(studentGraph: StudentGraphState, nodeIds: Set<string>, start: number, end: number) {
    const signals: StudentSignal[] = [];
    for (const nodeId of nodeIds) {
      const state = studentGraph.nodes[nodeId];
      if (!state) continue;
      for (const signal of state.signals) {
        if (signal.timestamp >= start && signal.timestamp < end) {
          signals.push(signal);
        }
      }
    }
    return signals;
  }

  private aggregateTrendScore(signals: StudentSignal[]) {
    if (!signals.length) return 0;
    let points = 0;
    for (const signal of signals) {
      if (signal.kind === 'answered') points += signal.correct ? 10 : 2;
      else if (signal.kind === 'mockPerformance') points += (signal.score / signal.maxScore) * 10;
      else if (signal.kind === 'completed') points += 8;
      else if (signal.kind === 'viewed') points += 3;
      else if (signal.kind === 'timeSpent') points += Math.min(signal.seconds / 300, 1) * 5;
      else if (signal.kind === 'aiInteraction') points += Math.min(signal.durationSeconds / 300, 1) * 4;
    }
    return points / signals.length;
  }

  private calculateConfidence(summary: SignalSummary) {
    const recencyBonus = summary.lastTimestamp && nowMs() - summary.lastTimestamp <= 7 * 24 * 60 * 60 * 1000 ? 20 : 0;
    const diversityBonus = Math.min((summary.distinctSignalKinds.size - 1) * 10, 20);
    const interactionScore = clamp(summary.totalSignals * 5, 0, 60);
    const score = clamp(interactionScore + recencyBonus + diversityBonus);
    const label: ConfidenceLabel = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    return { score, label };
  }

  private buildRecommendations(contributions: MasteryScoreBreakdown[]) {
    const sorted = [...contributions].sort((a, b) => a.score * a.weight - b.score * b.weight);
    const lowest = sorted.slice(0, 3).map((entry) => entry.type);
    const recommendations: string[] = [];

    if (lowest.includes('lessonCompletion')) {
      recommendations.push('Finish more lessons and review incomplete content.');
    }
    if (lowest.includes('questionCorrectness')) {
      recommendations.push('Practice targeted questions to improve answer accuracy.');
    }
    if (lowest.includes('mockPerformance')) {
      recommendations.push('Take mock tests and review incorrect items to strengthen readiness.');
    }
    if (lowest.includes('revisionFrequency')) {
      recommendations.push('Increase revision sessions for weaker topics.');
    }
    if (lowest.includes('studyTime')) {
      recommendations.push('Spend more consistent study time on the selected topic.');
    }
    if (lowest.includes('aiInteraction')) {
      recommendations.push('Use AI tutoring to clarify difficult concepts and next steps.');
    }

    return [...new Set(recommendations)];
  }
}

export const masteryService = new MasteryService();
