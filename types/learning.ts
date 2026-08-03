export type NodeType = 'module' | 'lesson' | 'topic' | 'concept' | 'mockTest' | 'question' | 'aiSession';

export type RelationType = 'prerequisite' | 'related' | 'parent' | 'dependsOn';

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: RelationType;
  metadata?: Record<string, any>;
}

export type StudentSignal =
  | { kind: 'completed'; timestamp: number }
  | { kind: 'viewed'; timestamp: number }
  | { kind: 'answered'; correct: boolean; timestamp: number }
  | { kind: 'timeSpent'; seconds: number; timestamp: number }
  | { kind: 'mockPerformance'; score: number; maxScore: number; timestamp: number }
  | { kind: 'aiInteraction'; durationSeconds: number; timestamp: number };

export interface StudentNodeState {
  nodeId: string;
  signals: StudentSignal[];
}

export interface StudentGraphState {
  studentId: string;
  nodes: Record<string, StudentNodeState>;
}

export interface KnowledgeGraphSummary {
  nodesCount: number;
  edgesCount: number;
}

export type MasteryEntityType = 'topic' | 'lesson' | 'module' | 'overall';

export type ConfidenceLabel = 'low' | 'medium' | 'high';
export type TrendLabel = 'improving' | 'stable' | 'declining';

export interface MasteryWeightConfig {
  questionCorrectness: number;
  mockPerformance: number;
  lessonCompletion: number;
  revisionFrequency: number;
  studyTime: number;
  aiInteraction: number;
}

export interface MasteryConfig {
  weights: MasteryWeightConfig;
  expectedStudyMinutes: number;
  expectedRevisionCount: number;
  expectedAITutorInteractions: number;
  recentWindowDays: number;
  priorWindowDays: number;
}

export interface MasteryScoreBreakdown {
  label: string;
  type: keyof MasteryWeightConfig;
  score: number;
  weight: number;
}

export interface MasteryResult {
  entityId: string;
  entityType: MasteryEntityType;
  score: number;
  confidenceLabel: ConfidenceLabel;
  confidenceScore: number;
  trend: TrendLabel;
  lastUpdated: number;
  contributions: MasteryScoreBreakdown[];
  recommendations: string[];
}

export type PrerequisiteStatus = 'satisfied' | 'pending' | 'none';

export type StudyItemType = 'lesson' | 'topic' | 'module' | 'revision' | 'catchup';

export interface StudyPlanItem {
  id: string;
  type: StudyItemType;
  title: string;
  estimatedDurationMinutes: number;
  priority: number;
  masteryGap: number;
  recommendationReason: string;
  prerequisiteStatus: PrerequisiteStatus;
  expectedImprovement: string;
  referenceEntityId?: string;
}

export interface DailyStudyPlan {
  studentId: string;
  date: string;
  items: StudyPlanItem[];
  totalEstimatedMinutes: number;
  generatedAt: number;
}

export interface WeeklyStudyPlan {
  studentId: string;
  startDate: string;
  dailyPlans: DailyStudyPlan[];
  generatedAt: number;
}

export interface RevisionScheduleItem {
  lessonId: string;
  lessonTitle: string;
  scheduledDate: string;
  intervalDays: number;
  reason: string;
}

export interface CatchUpPlan {
  studentId: string;
  missedDays: number;
  totalRequiredMinutes: number;
  dailyPlans: DailyStudyPlan[];
  generatedAt: number;
}

export interface StudyPlannerConfig {
  dailyStudyHours: number;
  weeklyStudyHours: number;
  maxDailyItems: number;
  revisionIntervals: number[];
  weakTopicThreshold: number;
  defaultLessonDuration: number;
  catchUpBufferHours: number;
  planningHorizonDays: number;
}

export interface StudyPlannerInput {
  examDate?: string;
  availableStudyHoursPerDay?: number;
  goalTopicIds?: string[];
  goalLessonIds?: string[];
  currentDate?: string;
  missedDays?: number;
}

export type ReadinessEntityType = 'overall' | 'module' | 'topic';

export type ReadinessConfidence = 'Low' | 'Moderate' | 'High';

export type ReadinessRisk = 'high' | 'medium' | 'low';

export interface ReadinessRiskThresholds {
  high: number;
  medium: number;
}

export interface ReadinessWeightConfig {
  mastery: number;
  mockPerformance: number;
  completion: number;
  revisionCoverage: number;
  consistency: number;
  recency: number;
  plannerProgress: number;
}

export interface ReadinessConfig {
  weights: ReadinessWeightConfig;
  riskThresholds: ReadinessRiskThresholds;
  recentWindowDays: number;
  priorWindowDays: number;
  examUrgencyDays: {
    critical: number;
    near: number;
  };
}

export interface ReadinessInput {
  examDate?: string;
  currentDate?: string;
}

export interface ReadinessAction {
  action: string;
  reason: string;
}

export interface ReadinessResult {
  entityId: string;
  entityType: ReadinessEntityType;
  readinessScore: number;
  confidence: ReadinessConfidence;
  trend: TrendLabel;
  risk: ReadinessRisk;
  strongestAreas: string[];
  weakestAreas: string[];
  recommendedActions: ReadinessAction[];
  details: {
    masteryScore: number;
    mockExamScore: number;
    completionScore: number;
    revisionCoverage: number;
    consistencyScore: number;
    recencyScore: number;
    plannerProgress: number;
    examDate?: string;
    examDaysRemaining?: number | null;
  };
}

export type RecommendationType =
  | 'nextLesson'
  | 'practiceQuestions'
  | 'mockTest'
  | 'revisionSession'
  | 'aiTutor'
  | 'moduleReview';

export type RecommendationConfidence = 'Low' | 'Moderate' | 'High';

export type RecommendationSource =
  | 'weakTopic'
  | 'readinessGap'
  | 'planner'
  | 'masteryTrend'
  | 'prerequisite'
  | 'mockPerformance'
  | 'recentActivity';

export interface RecommendationSignalContributor {
  name: string;
  value: number | string;
}

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  confidence: RecommendationConfidence;
  priority: number;
  estimatedDurationMinutes: number;
  reason: string;
  relatedMasteryGap: number;
  relatedReadinessImpact: number;
  source: RecommendationSource;
  signals: RecommendationSignalContributor[];
  expectedImprovement: string;
  referenceEntityId?: string;
}

export interface RecommendationSummary {
  studentId: string;
  totalRecommendations: number;
  averagePriority: number;
  readinessScore: number;
  masteryScore: number;
  weakTopics: string[];
  topSources: RecommendationSource[];
  generatedAt: number;
}

export interface RecommendationConfig {
  weights: {
    masteryGap: number;
    readinessImpact: number;
    examRelevance: number;
    prerequisiteImportance: number;
    recency: number;
    engagement: number;
  };
  durationMinutes: {
    nextLesson: number;
    practiceQuestions: number;
    mockTest: number;
    revisionSession: number;
    aiTutor: number;
    moduleReview: number;
  };
  weakTopicThreshold: number;
  lowReadinessThreshold: number;
  recentActivityDays: number;
}

export interface RecommendationInput {
  currentDate?: string;
  examDate?: string;
  limit?: number;
}
