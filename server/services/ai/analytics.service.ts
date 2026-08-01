export interface AnalyticsSnapshot {
  topicMastery: Record<string, number>;
  accuracyTrend: number[];
  completionTrend: number[];
  studyTimeMinutes: number;
  streakDays: number;
  readinessScore: number;
}

export class AnalyticsService {
  buildSnapshot(input: Partial<AnalyticsSnapshot> = {}): AnalyticsSnapshot {
    return {
      topicMastery: {
        Corrosion: 72,
        'Aircraft Materials': 81,
      },
      accuracyTrend: [64, 68, 71, 74],
      completionTrend: [20, 34, 58, 76],
      studyTimeMinutes: 240,
      streakDays: 4,
      readinessScore: 78,
      ...input,
    };
  }
}

export const analyticsService = new AnalyticsService();
