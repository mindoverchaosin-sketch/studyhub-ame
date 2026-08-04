import { knowledgeGraphService } from './knowledge-graph.service';
import { MasteryService, type MasteryRequestContext } from './mastery.service';
import type {
  StudyPlannerConfig,
  StudyPlannerInput,
  DailyStudyPlan,
  WeeklyStudyPlan,
  StudyPlanItem,
  StudyItemType,
  MasteryResult,
  GraphNode,
  RevisionScheduleItem,
  CatchUpPlan,
} from '@/types/learning';
import type { KnowledgeGraphService } from './knowledge-graph.service';

const defaultConfig: StudyPlannerConfig = {
  dailyStudyHours: 2,
  weeklyStudyHours: 10,
  maxDailyItems: 6,
  revisionIntervals: [1, 3, 7, 14, 30],
  weakTopicThreshold: 65,
  defaultLessonDuration: 30,
  catchUpBufferHours: 1,
  planningHorizonDays: 7,
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export class StudyPlannerService {
  private config: StudyPlannerConfig;
  private kg: KnowledgeGraphService;
  private mastery: MasteryService;

  constructor(
    config?: Partial<StudyPlannerConfig>,
    kg?: KnowledgeGraphService,
    mastery?: MasteryService,
  ) {
    this.config = { ...defaultConfig, ...(config ?? {}) };
    this.kg = kg ?? knowledgeGraphService;
    this.mastery = mastery ?? new MasteryService(undefined, this.kg);
  }

  async generateDailyPlan(studentId: string, input?: StudyPlannerInput, masteryContext?: MasteryRequestContext): Promise<DailyStudyPlan> {
    const date = input?.currentDate ?? isoDate(new Date());
    const hours = input?.availableStudyHoursPerDay ?? this.config.dailyStudyHours;
    const availableMinutes = hours * 60;
    const items = await this.buildPlanItems(studentId, input, undefined, masteryContext);
    const scheduled = this.scheduleItems(items, availableMinutes);
    return {
      studentId,
      date,
      items: scheduled,
      totalEstimatedMinutes: scheduled.reduce((sum, item) => sum + item.estimatedDurationMinutes, 0),
      generatedAt: Date.now(),
    };
  }

  async generateWeeklyPlan(studentId: string, input?: StudyPlannerInput, masteryContext?: MasteryRequestContext): Promise<WeeklyStudyPlan> {
    const startDate = input?.currentDate ?? isoDate(new Date());
    const dailyPlans: DailyStudyPlan[] = [];
    const schedule = await this.buildPlanItems(studentId, input, this.config.planningHorizonDays, masteryContext);
    let remainingItems = schedule.slice();
    for (let dayIndex = 0; dayIndex < this.config.planningHorizonDays; dayIndex += 1) {
      const targetDate = isoDate(new Date(Date.parse(startDate) + dayIndex * 24 * 60 * 60 * 1000));
      const availableMinutes = (input?.availableStudyHoursPerDay ?? this.config.dailyStudyHours) * 60;
      const [dayItems, rest] = this.scheduleItemsWithRest(remainingItems, availableMinutes);
      remainingItems = rest;
      dailyPlans.push({
        studentId,
        date: targetDate,
        items: dayItems,
        totalEstimatedMinutes: dayItems.reduce((sum, item) => sum + item.estimatedDurationMinutes, 0),
        generatedAt: Date.now(),
      });
    }

    return {
      studentId,
      startDate,
      dailyPlans,
      generatedAt: Date.now(),
    };
  }

  async generateRevisionSchedule(studentId: string, input?: StudyPlannerInput, masteryContext?: MasteryRequestContext): Promise<RevisionScheduleItem[]> {
    const date = input?.currentDate ? new Date(input.currentDate) : new Date();
    const weakTopics = await this.findWeakTopics(studentId, masteryContext);
    const schedule: RevisionScheduleItem[] = [];
    for (const topic of weakTopics) {
      const node = await this.kg.getNode(topic.entityId);
      const title = node?.title ?? `Topic ${topic.entityId}`;
      for (const interval of this.config.revisionIntervals) {
        const scheduledDate = isoDate(new Date(date.getTime() + interval * 24 * 60 * 60 * 1000));
        schedule.push({
          lessonId: topic.entityId,
          lessonTitle: title,
          scheduledDate,
          intervalDays: interval,
          reason: `Revision for weak topic ${title} after ${interval} day(s)`,
        });
      }
    }
    return schedule;
  }

  async generateCatchUpPlan(studentId: string, input?: StudyPlannerInput, masteryContext?: MasteryRequestContext): Promise<CatchUpPlan> {
    const missedDays = input?.missedDays ?? 0;
    if (missedDays <= 0) {
      return { studentId, missedDays: 0, totalRequiredMinutes: 0, dailyPlans: [], generatedAt: Date.now() };
    }

    const remainingHours = input?.availableStudyHoursPerDay ?? this.config.dailyStudyHours;
    const availableMinutes = Math.max(remainingHours * 60 - this.config.catchUpBufferHours * 60, 0);
    const catchUpItems = await this.buildCatchUpItems(studentId, missedDays, masteryContext);
    const dailyPlans: DailyStudyPlan[] = [];
    let rest = catchUpItems.slice();
    const startDate = input?.currentDate ?? isoDate(new Date());

    for (let dayIndex = 0; dayIndex < missedDays; dayIndex += 1) {
      const targetDate = isoDate(new Date(Date.parse(startDate) + dayIndex * 24 * 60 * 60 * 1000));
      const [dayItems, remaining] = this.scheduleItemsWithRest(rest, availableMinutes);
      rest = remaining;
      dailyPlans.push({
        studentId,
        date: targetDate,
        items: dayItems,
        totalEstimatedMinutes: dayItems.reduce((sum, item) => sum + item.estimatedDurationMinutes, 0),
        generatedAt: Date.now(),
      });
    }

    return {
      studentId,
      missedDays,
      totalRequiredMinutes: catchUpItems.reduce((sum, item) => sum + item.estimatedDurationMinutes, 0),
      dailyPlans,
      generatedAt: Date.now(),
    };
  }

  private async buildPlanItems(studentId: string, input?: StudyPlannerInput, _planningHorizonDays?: number, masteryContext?: MasteryRequestContext) {
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const allTopics = await this.kg.listNodes({ type: 'topic' });
    const masteryScores = await Promise.all(allTopics.map((topic) => this.mastery.getTopicMastery(studentId, topic.id, requestContext)));
    const weakTopics = masteryScores.filter((score) => score.score < this.config.weakTopicThreshold);
    const schedule = weakTopics.map((topic) => this.createItemFromTopic(topic));
    const bottomItems = allTopics
      .filter((topic) => !weakTopics.some((weak) => weak.entityId === topic.id))
      .slice(0, 10)
      .map((topic) => this.createItemFallback(topic));
    return [...schedule, ...bottomItems];
  }

  private async buildCatchUpItems(studentId: string, missedDays: number, masteryContext?: MasteryRequestContext) {
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const allTopics = await this.kg.listNodes({ type: 'topic' });
    const masteryScores = await Promise.all(allTopics.map((topic) => this.mastery.getTopicMastery(studentId, topic.id, requestContext)));
    const sorted = masteryScores.sort((a, b) => a.score - b.score || b.confidenceScore - a.confidenceScore);
    return sorted.slice(0, missedDays * 2).map((topic) => this.createItemFromTopic(topic, 'catchup'));
  }

  private createItemFromTopic(topic: MasteryResult, type: StudyItemType = 'topic'): StudyPlanItem {
    const priority = clamp((100 - topic.score) + (topic.confidenceLabel === 'low' ? 10 : 0));
    return {
      id: topic.entityId,
      type,
      title: `Study ${topic.entityType} ${topic.entityId}`,
      estimatedDurationMinutes: this.config.defaultLessonDuration,
      priority,
      masteryGap: clamp(100 - topic.score),
      recommendationReason: `Focus on weaker ${topic.entityType} content with current mastery ${Math.round(topic.score)}%.`,
      prerequisiteStatus: 'pending',
      expectedImprovement: 'Increase mastery through focused revision and practice.',
      referenceEntityId: topic.entityId,
    };
  }

  private createItemFallback(topic: GraphNode): StudyPlanItem {
    return {
      id: topic.id,
      type: 'topic',
      title: `Review ${topic.title}`,
      estimatedDurationMinutes: this.config.defaultLessonDuration,
      priority: 50,
      masteryGap: 20,
      recommendationReason: 'Reinforce subject knowledge for long-term retention.',
      prerequisiteStatus: 'none',
      expectedImprovement: 'Solidify existing understanding.',
    };
  }

  private scheduleItems(items: StudyPlanItem[], availableMinutes: number): StudyPlanItem[] {
    const sorted = items.sort((a, b) => b.priority - a.priority || b.masteryGap - a.masteryGap);
    const selected: StudyPlanItem[] = [];
    let remaining = availableMinutes;
    for (const item of sorted) {
      if (item.estimatedDurationMinutes <= remaining && selected.length < this.config.maxDailyItems) {
        selected.push(item);
        remaining -= item.estimatedDurationMinutes;
      }
    }
    return selected;
  }

  private scheduleItemsWithRest(items: StudyPlanItem[], availableMinutes: number): [StudyPlanItem[], StudyPlanItem[]] {
    const scheduled: StudyPlanItem[] = [];
    const rest: StudyPlanItem[] = [];
    let remaining = availableMinutes;
    const sorted = items.sort((a, b) => b.priority - a.priority || b.masteryGap - a.masteryGap);
    for (const item of sorted) {
      if (item.estimatedDurationMinutes <= remaining && scheduled.length < this.config.maxDailyItems) {
        scheduled.push(item);
        remaining -= item.estimatedDurationMinutes;
      } else {
        rest.push(item);
      }
    }
    return [scheduled, rest];
  }

  private async findWeakTopics(studentId: string, masteryContext?: MasteryRequestContext) {
    const requestContext = masteryContext ?? await this.mastery.createRequestContext(studentId);
    const allTopics = await this.kg.listNodes({ type: 'topic' });
    const masteryScores = await Promise.all(allTopics.map((topic) => this.mastery.getTopicMastery(studentId, topic.id, requestContext)));
    return masteryScores.filter((score) => score.score < this.config.weakTopicThreshold);
  }
}

export const studyPlannerService = new StudyPlannerService();
