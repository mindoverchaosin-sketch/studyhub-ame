import { describe, it, expect } from 'vitest';
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';
import { MasteryService } from '@/server/services/learning/mastery.service';

const timestamp = Date.now();

async function setupHighPerformer(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicA', type: 'topic', title: 'Topic A' });
  await kg.upsertNode({ id: 'lessonA1', type: 'lesson', title: 'Lesson A1' });
  await kg.upsertEdge({ id: 'e1', sourceId: 'topicA', targetId: 'lessonA1', relation: 'parent' });

  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'completed', timestamp: timestamp - 1000 });
  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'viewed', timestamp: timestamp - 2000 });
  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'answered', correct: true, timestamp: timestamp - 1500 });
  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'timeSpent', seconds: 3600, timestamp: timestamp - 1000 });
  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'mockPerformance', score: 45, maxScore: 50, timestamp: timestamp - 500 });
  await kg.recordStudentSignal('student1', 'lessonA1', { kind: 'aiInteraction', durationSeconds: 300, timestamp: timestamp - 400 });
}

async function setupWeakPerformer(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicB', type: 'topic', title: 'Topic B' });
  await kg.upsertNode({ id: 'lessonB1', type: 'lesson', title: 'Lesson B1' });
  await kg.upsertEdge({ id: 'e2', sourceId: 'topicB', targetId: 'lessonB1', relation: 'parent' });

  await kg.recordStudentSignal('student2', 'lessonB1', { kind: 'viewed', timestamp: timestamp - 1000 });
  await kg.recordStudentSignal('student2', 'lessonB1', { kind: 'answered', correct: false, timestamp: timestamp - 900 });
  await kg.recordStudentSignal('student2', 'lessonB1', { kind: 'timeSpent', seconds: 300, timestamp: timestamp - 800 });
}

async function setupMixedPerformer(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicC', type: 'topic', title: 'Topic C' });
  await kg.upsertNode({ id: 'lessonC1', type: 'lesson', title: 'Lesson C1' });
  await kg.upsertEdge({ id: 'e3', sourceId: 'topicC', targetId: 'lessonC1', relation: 'parent' });

  await kg.recordStudentSignal('student3', 'lessonC1', { kind: 'viewed', timestamp: timestamp - 1000 });
  await kg.recordStudentSignal('student3', 'lessonC1', { kind: 'answered', correct: true, timestamp: timestamp - 900 });
  await kg.recordStudentSignal('student3', 'lessonC1', { kind: 'answered', correct: false, timestamp: timestamp - 800 });
  await kg.recordStudentSignal('student3', 'lessonC1', { kind: 'timeSpent', seconds: 900, timestamp: timestamp - 700 });
  await kg.recordStudentSignal('student3', 'lessonC1', { kind: 'mockPerformance', score: 20, maxScore: 50, timestamp: timestamp - 600 });
}

async function setupImprovingPerformer(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicD', type: 'topic', title: 'Topic D' });
  await kg.upsertNode({ id: 'lessonD1', type: 'lesson', title: 'Lesson D1' });
  await kg.upsertEdge({ id: 'e4', sourceId: 'topicD', targetId: 'lessonD1', relation: 'parent' });

  const now = Date.now();
  await kg.recordStudentSignal('student4', 'lessonD1', { kind: 'answered', correct: false, timestamp: now - 25 * 24 * 60 * 60 * 1000 });
  await kg.recordStudentSignal('student4', 'lessonD1', { kind: 'answered', correct: true, timestamp: now - 1 * 24 * 60 * 60 * 1000 });
}

async function setupDecliningPerformer(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicE', type: 'topic', title: 'Topic E' });
  await kg.upsertNode({ id: 'lessonE1', type: 'lesson', title: 'Lesson E1' });
  await kg.upsertEdge({ id: 'e5', sourceId: 'topicE', targetId: 'lessonE1', relation: 'parent' });

  const now = Date.now();
  await kg.recordStudentSignal('student5', 'lessonE1', { kind: 'answered', correct: true, timestamp: now - 25 * 24 * 60 * 60 * 1000 });
  await kg.recordStudentSignal('student5', 'lessonE1', { kind: 'answered', correct: false, timestamp: now - 1 * 24 * 60 * 60 * 1000 });
}

async function setupConfigurableWeights(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topicF', type: 'topic', title: 'Topic F' });
  await kg.upsertNode({ id: 'lessonF1', type: 'lesson', title: 'Lesson F1' });
  await kg.upsertEdge({ id: 'e6', sourceId: 'topicF', targetId: 'lessonF1', relation: 'parent' });

  await kg.recordStudentSignal('student6', 'lessonF1', { kind: 'answered', correct: true, timestamp: timestamp - 1000 });
  await kg.recordStudentSignal('student6', 'lessonF1', { kind: 'mockPerformance', score: 30, maxScore: 50, timestamp: timestamp - 800 });
}

describe('MasteryService', () => {
  it('calculates high mastery for strong students', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService(undefined, kg);
    await setupHighPerformer(kg);

    const result = await mastery.getTopicMastery('student1', 'topicA');
    expect(result.score).toBeGreaterThan(80);
    expect(result.confidenceLabel).toBe('high');
    expect(['stable', 'improving']).toContain(result.trend);
    expect(result.contributions.some((c) => c.type === 'questionCorrectness')).toBe(true);
  });

  it('calculates low mastery for weak students', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService(undefined, kg);
    await setupWeakPerformer(kg);

    const result = await mastery.getTopicMastery('student2', 'topicB');
    expect(result.score).toBeLessThan(40);
    expect(result.confidenceLabel).toBe('medium');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('handles mixed signals deterministically', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService(undefined, kg);
    await setupMixedPerformer(kg);

    const result = await mastery.getTopicMastery('student3', 'topicC');
    expect(result.score).toBeGreaterThan(30);
    expect(result.score).toBeLessThan(70);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('returns stable or improving with recent improvement', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService(undefined, kg);
    await setupImprovingPerformer(kg);

    const result = await mastery.getTopicMastery('student4', 'topicD');
    expect(result.trend).toBe('improving');
  });

  it('returns declining trend for worsening recent performance', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService(undefined, kg);
    await setupDecliningPerformer(kg);

    const result = await mastery.getTopicMastery('student5', 'topicE');
    expect(result.trend).toBe('declining');
  });

  it('returns low confidence with sparse data', async () => {
    const kg = new KnowledgeGraphService();
    const mastery = new MasteryService();
    await kg.upsertNode({ id: 'topicG', type: 'topic', title: 'Topic G' });
    await kg.upsertNode({ id: 'lessonG1', type: 'lesson', title: 'Lesson G1' });
    await kg.upsertEdge({ id: 'e7', sourceId: 'topicG', targetId: 'lessonG1', relation: 'parent' });

    const result = await mastery.getTopicMastery('student7', 'topicG');
    expect(result.confidenceLabel).toBe('low');
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('respects configurable weights', async () => {
    const kg = new KnowledgeGraphService();
    const customized = new MasteryService({ weights: { questionCorrectness: 0.1, mockPerformance: 0.1, lessonCompletion: 0.1, revisionFrequency: 0.1, studyTime: 0.1, aiInteraction: 0.5 } }, kg);
    await setupConfigurableWeights(kg);

    const result = await customized.getTopicMastery('student6', 'topicF');
    expect(result.score).toBeLessThan(90);
    expect(result.contributions.find((c) => c.type === 'aiInteraction')).toBeDefined();
  });
});
