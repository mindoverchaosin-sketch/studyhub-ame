import { describe, expect, it } from 'vitest';
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';
import { MasteryService } from '@/server/services/learning/mastery.service';
import { StudyPlannerService } from '@/server/services/learning/study-planner.service';
import { ReadinessService } from '@/server/services/learning/readiness.service';
import { RecommendationService } from '@/server/services/learning/recommendation.service';

const baseDate = '2026-08-02';

async function setupGraph(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topic1', type: 'topic', title: 'Algebra' });
  await kg.upsertNode({ id: 'topic2', type: 'topic', title: 'Geometry' });
  await kg.upsertNode({ id: 'topic3', type: 'topic', title: 'Statistics' });
  await kg.upsertNode({ id: 'lesson1', type: 'lesson', title: 'Linear equations' });
  await kg.upsertNode({ id: 'lesson2', type: 'lesson', title: 'Triangles' });
  await kg.upsertNode({ id: 'mock1', type: 'mockTest', title: 'Mock Exam 1' });
  await kg.upsertEdge({ id: 'edge1', sourceId: 'topic1', targetId: 'lesson1', relation: 'parent' });
  await kg.upsertEdge({ id: 'edge2', sourceId: 'topic2', targetId: 'lesson2', relation: 'parent' });
  await kg.upsertEdge({ id: 'edge3', sourceId: 'topic1', targetId: 'topic2', relation: 'prerequisite' });
}

describe('RecommendationService', () => {
  it('generates focused recommendations for weak students', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const readiness = new ReadinessService(undefined, kg, mastery, planner);
    const service = new RecommendationService(undefined, kg, mastery, planner, readiness);

    await kg.recordStudentSignal('studentWeak', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });
    await kg.recordStudentSignal('studentWeak', 'lesson2', { kind: 'mockPerformance', score: 40, maxScore: 100, timestamp: Date.now() - 1000 });

    const recommendations = await service.getRecommendations('studentWeak', { currentDate: baseDate, examDate: '2026-09-01' });
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((item) => item.type === 'mockTest')).toBe(true);
    expect(recommendations.some((item) => item.type === 'revisionSession')).toBe(true);
    expect(recommendations.every((item) => item.priority >= 0 && item.priority <= 100)).toBe(true);
    expect(recommendations[0].reason).toBeTruthy();
  });

  it('produces high-confidence recommendations for strong students', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const readiness = new ReadinessService(undefined, kg, mastery, planner);
    const service = new RecommendationService(undefined, kg, mastery, planner, readiness);

    await kg.recordStudentSignal('studentStrong', 'lesson1', { kind: 'completed', timestamp: Date.now() - 50000 });
    await kg.recordStudentSignal('studentStrong', 'lesson1', { kind: 'answered', correct: true, timestamp: Date.now() - 40000 });
    await kg.recordStudentSignal('studentStrong', 'lesson1', { kind: 'mockPerformance', score: 90, maxScore: 100, timestamp: Date.now() - 30000 });

    const recommendations = await service.getRecommendations('studentStrong', { currentDate: baseDate });
    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.some((item) => item.confidence === 'High')).toBe(true);
  });

  it('avoids duplicate recommendations by referenceEntityId', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const readiness = new ReadinessService(undefined, kg, mastery, planner);
    const service = new RecommendationService(undefined, kg, mastery, planner, readiness);

    await kg.recordStudentSignal('studentUnique', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });
    const recommendations = await service.getRecommendations('studentUnique', { currentDate: baseDate, examDate: '2026-09-01' });

    const ids = recommendations.map((item) => item.referenceEntityId ?? item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns a concise recommendation summary', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const readiness = new ReadinessService(undefined, kg, mastery, planner);
    const service = new RecommendationService(undefined, kg, mastery, planner, readiness);

    await kg.recordStudentSignal('studentSummary', 'lesson1', { kind: 'answered', correct: true, timestamp: Date.now() - 1000 });
    const summary = await service.getRecommendationSummary('studentSummary', { currentDate: baseDate });
    expect(summary.studentId).toBe('studentSummary');
    expect(summary.totalRecommendations).toBeGreaterThanOrEqual(0);
    expect(summary.averagePriority).toBeGreaterThanOrEqual(0);
    expect(summary.topSources.length).toBeGreaterThanOrEqual(0);
  });
});
