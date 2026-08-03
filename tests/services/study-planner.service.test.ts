import { describe, expect, it } from 'vitest';
import { KnowledgeGraphService } from '@/server/services/learning/knowledge-graph.service';
import { MasteryService } from '@/server/services/learning/mastery.service';
import { StudyPlannerService } from '@/server/services/learning/study-planner.service';

const baseDate = '2026-08-01';

async function setupPlannerGraph(kg: KnowledgeGraphService) {
  await kg.upsertNode({ id: 'topic1', type: 'topic', title: 'Topic 1' });
  await kg.upsertNode({ id: 'topic2', type: 'topic', title: 'Topic 2' });
  await kg.upsertNode({ id: 'lesson1', type: 'lesson', title: 'Lesson 1' });
  await kg.upsertNode({ id: 'lesson2', type: 'lesson', title: 'Lesson 2' });
  await kg.upsertEdge({ id: 'edge1', sourceId: 'topic1', targetId: 'lesson1', relation: 'parent' });
  await kg.upsertEdge({ id: 'edge2', sourceId: 'topic2', targetId: 'lesson2', relation: 'parent' });
}

describe('StudyPlannerService', () => {
  it('generates a deterministic daily plan with available minutes', async () => {
    const kg = new KnowledgeGraphService();
    await setupPlannerGraph(kg);
    await kg.recordStudentSignal('studentA', 'lesson1', { kind: 'completed', timestamp: Date.now() - 1000 });
    await kg.recordStudentSignal('studentA', 'lesson1', { kind: 'answered', correct: true, timestamp: Date.now() - 900 });
    await kg.recordStudentSignal('studentA', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 800 });

    const planner = new StudyPlannerService({ dailyStudyHours: 1, defaultLessonDuration: 30, maxDailyItems: 2 }, kg, new MasteryService(undefined, kg));
    const plan = await planner.generateDailyPlan('studentA', { currentDate: baseDate, availableStudyHoursPerDay: 1 });

    expect(plan.date).toBe(baseDate);
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.totalEstimatedMinutes).toBeLessThanOrEqual(60);
    expect(plan.items.every((item) => item.estimatedDurationMinutes <= 30)).toBe(true);
  });

  it('generates a weekly plan with no duplicate item ids', async () => {
    const kg = new KnowledgeGraphService();
    await setupPlannerGraph(kg);
    await kg.recordStudentSignal('studentB', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 900 });

    const planner = new StudyPlannerService({ dailyStudyHours: 1, defaultLessonDuration: 30, maxDailyItems: 2, planningHorizonDays: 3 }, kg, new MasteryService(undefined, kg));
    const week = await planner.generateWeeklyPlan('studentB', { currentDate: baseDate, availableStudyHoursPerDay: 1 });

    expect(week.dailyPlans.length).toBe(3);
    const ids = week.dailyPlans.flatMap((day) => day.items.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('creates a catch-up plan for missed days', async () => {
    const kg = new KnowledgeGraphService();
    await setupPlannerGraph(kg);
    await kg.recordStudentSignal('studentC', 'lesson1', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });

    const planner = new StudyPlannerService({ dailyStudyHours: 1, defaultLessonDuration: 30, maxDailyItems: 2 }, kg, new MasteryService(undefined, kg));
    const catchUp = await planner.generateCatchUpPlan('studentC', { currentDate: baseDate, missedDays: 2, availableStudyHoursPerDay: 1 });

    expect(catchUp.missedDays).toBe(2);
    expect(catchUp.dailyPlans.length).toBe(2);
    expect(catchUp.totalRequiredMinutes).toBeGreaterThan(0);
  });

  it('builds a revision schedule from weak topic mastery', async () => {
    const kg = new KnowledgeGraphService();
    await setupPlannerGraph(kg);
    await kg.recordStudentSignal('studentD', 'lesson2', { kind: 'answered', correct: false, timestamp: Date.now() - 1000 });

    const planner = new StudyPlannerService({ weakTopicThreshold: 100 }, kg, new MasteryService(undefined, kg));
    const schedule = await planner.generateRevisionSchedule('studentD', { currentDate: baseDate });

    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule[0]).toHaveProperty('scheduledDate', '2026-08-02');
  });
});
