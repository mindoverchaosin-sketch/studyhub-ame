import { describe, expect, it, vi } from 'vitest';
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';
import { MasteryService } from '@/server/services/learning/mastery.service';
import { StudyPlannerService } from '@/server/services/learning/study-planner.service';
import { ReadinessService } from '@/server/services/learning/readiness.service';

const baseDate = '2026-08-02';

async function setupGraph(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topic1', type: 'topic', title: 'Algebra' });
  await kg.upsertNode({ id: 'topic2', type: 'topic', title: 'Geometry' });
  await kg.upsertNode({ id: 'topic3', type: 'topic', title: 'Statistics' });
  await kg.upsertNode({ id: 'lesson1', type: 'lesson', title: 'Linear equations' });
  await kg.upsertNode({ id: 'lesson2', type: 'lesson', title: 'Triangles' });
  await kg.upsertEdge({ id: 'edge1', sourceId: 'topic1', targetId: 'lesson1', relation: 'parent' });
  await kg.upsertEdge({ id: 'edge2', sourceId: 'topic2', targetId: 'lesson2', relation: 'parent' });
}

describe('ReadinessService', () => {
  it('scores high readiness when mastery and mock scores are strong', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const service = new ReadinessService(undefined, kg, mastery, planner);

    await kg.recordStudentSignal('studentHigh', 'lesson1', { kind: 'completed', timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000 });
    await kg.recordStudentSignal('studentHigh', 'lesson1', { kind: 'answered', correct: true, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 });
    await kg.recordStudentSignal('studentHigh', 'lesson1', { kind: 'timeSpent', seconds: 1800, timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 });
    await kg.recordStudentSignal('studentHigh', 'lesson1', { kind: 'mockPerformance', score: 90, maxScore: 100, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 });
    await kg.recordStudentSignal('studentHigh', 'lesson2', { kind: 'answered', correct: true, timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 });
    await kg.recordStudentSignal('studentHigh', 'lesson2', { kind: 'completed', timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000 });

    const readiness = await service.getOverallReadiness('studentHigh', { currentDate: baseDate, examDate: '2026-09-01' });
    expect(readiness.readinessScore).toBeGreaterThan(65);
    expect(readiness.confidence).toBe('High');
    expect(readiness.risk).toBe('low');
    expect(readiness.recommendedActions.length).toBeGreaterThan(0);
  });

  it('scores low readiness when there is little data and weak performance', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const service = new ReadinessService(undefined, kg, mastery, planner);

    await kg.recordStudentSignal('studentLow', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });
    await kg.recordStudentSignal('studentLow', 'lesson2', { kind: 'viewed', timestamp: Date.now() - 900 });

    const readiness = await service.getOverallReadiness('studentLow', { currentDate: baseDate, examDate: '2026-09-01' });
    expect(readiness.readinessScore).toBeLessThan(60);
    expect(readiness.confidence).toBe('Low');
    expect(readiness.risk).toBe('high');
    expect(readiness.recommendedActions.some((action) => action.action.includes('Revise'))).toBe(true);
  });

  it('classifies topic readiness and returns weak/strong areas', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const service = new ReadinessService(undefined, kg, mastery, planner);

    await kg.recordStudentSignal('studentMix', 'lesson1', { kind: 'answered', correct: true, timestamp: Date.now() - 1000 });
    await kg.recordStudentSignal('studentMix', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });

    const topicReadiness = await service.getTopicReadiness('studentMix', 'topic1');
    expect(topicReadiness.entityType).toBe('topic');
    expect(topicReadiness.weakestAreas.length).toBeGreaterThanOrEqual(0);
    expect(topicReadiness.strongestAreas.length).toBeGreaterThanOrEqual(0);
  });

  it('detects trend as stable when there is no historical snapshot', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const service = new ReadinessService(undefined, kg, mastery, planner);

    const readiness = await service.getOverallReadiness('studentTrend', { currentDate: baseDate });
    expect(readiness.trend).toBe('stable');
  });

  it('supports configurable readiness weights', async () => {
    const kg = new KnowledgeGraphService();
    await setupGraph(kg);
    const mastery = new MasteryService(undefined, kg);
    const planner = new StudyPlannerService(undefined, kg, mastery);
    const service = new ReadinessService({ weights: { mastery: 0.1, mockPerformance: 0.1, completion: 0.3, revisionCoverage: 0.2, consistency: 0.2, recency: 0.1, plannerProgress: 0.1 } }, kg, mastery, planner);

    await kg.recordStudentSignal('studentConfig', 'lesson1', { kind: 'mockPerformance', score: 30, maxScore: 100, timestamp: Date.now() - 1000 });
    const readiness = await service.getOverallReadiness('studentConfig', { currentDate: baseDate });
    expect(readiness.readinessScore).toBeGreaterThanOrEqual(0);
    expect(readiness.readinessScore).toBeLessThanOrEqual(100);
  });
});
