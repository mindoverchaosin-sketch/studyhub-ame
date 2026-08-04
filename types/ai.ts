export type AIMessageRole = "assistant" | "user" | "system";

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  jsonOutput: boolean;
  embeddings: boolean;
}

export interface AIStreamOptions {
  timeoutMs?: number;
  attempt?: number;
  signal?: AbortSignal;
}

export interface AIStreamChunk {
  type: 'delta' | 'done' | 'error';
  content?: string;
  finishReason?: string;
  usage?: AIUsage;
  model?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  conversationId?: string;
}

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  createdAt: string;
  finishReason?: string;
  usage?: AIUsage;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  lastUpdated: string;
}

export interface AIContextSnapshot {
  currentModule: string;
  currentLesson: string;
  mockPerformance: number;
  weakTopics: string[];
  recentQuestions: string[];
  studyStreak: number;
  learningGoals: string[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export type AIContentSourceType = 'lesson' | 'module' | 'question' | 'note' | 'mockTest';

export interface AIContentSource {
  id: string;
  type: AIContentSourceType;
  title: string;
  excerpt: string;
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface AIContentChunk {
  id: string;
  sourceId: string;
  sourceType: AIContentSourceType;
  title: string;
  text: string;
  metadata: Record<string, unknown>;
}

export interface AIRetrievalContext {
  retrievalQuery: string;
  sourceSummary: string;
  retrievedSources: AIContentSource[];
  retrievedChunks: AIContentChunk[];
}

export interface AILearnerProfile {
  overallMastery: number;
  masteryConfidence: string;
  masteryTrend: string;
  readinessScore: number;
  readinessRisk: string;
  readinessConfidence: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendedActions: string[];
  topRecommendations: Array<{ title: string; reason: string; priority: number; source: string }>;
  weeklyPlanSummary: string;
  analyticsSummary: string;
  knowledgeGraphSummary: string;
}

export interface AIExplanation {
  answer: string;
  simplified: string;
  relatedConcepts: string[];
  commonMistakes: string[];
  similarQuestions: string[];
}

export interface Question {
  id: string;
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  module: string;
  topic: string;
  standard: "DGCA" | "EASA" | "Both";
  status: "Answered" | "Unanswered";
  isBookmarked: boolean;
  lastAttemptedAt?: string;
  recommended: boolean;
  explanation?: AIExplanation;
}

export interface QuestionFilter {
  search?: string;
  standard?: string;
  module?: string;
  topic?: string;
  difficulty?: string;
  status?: string;
  bookmarkedOnly?: boolean;
  recentOnly?: boolean;
  recommendedOnly?: boolean;
}

export interface Bookmark {
  id: string;
  questionId: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  ctaLabel: string;
  href: string;
  priority: "High" | "Medium" | "Low";
}

export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>;
}

export interface RetrievedCitation {
  sourceType: AIContentSourceType | 'mockTest';
  sourceId: string;
  title: string;
  chunkId: string;
  relevanceScore: number;
}

export interface RetrievalCandidate {
  chunk: AIContentChunk;
  keywordScore?: number;
  semanticScore?: number;
  metadataScore?: number;
  recencyScore?: number;
  lessonPriority?: number;
  moduleRelevance?: number;
  rankingScore?: number;
  citation: RetrievedCitation;
}

export interface RankedRetrievalResult extends RetrievalCandidate {}

export interface RetrievalMetrics {
  chunksSearched: number;
  chunksSelected: number;
  keywordHits: number;
  vectorHits: number;
  retrievalLatencyMs: number;
  rankingLatencyMs: number;
  totalRetrievalTimeMs: number;
}

export interface AIRequestContext {
  prompt: string;
  conversation: AIConversation;
  contextSnapshot?: AIContextSnapshot;
  retrievalContext?: AIRetrievalContext;
  learnerProfile?: AILearnerProfile;
}

export interface AIProvider {
  readonly capabilities?: ProviderCapabilities;
  generateResponse(context: AIRequestContext): Promise<AIMessage>;
  generateExplanation(question: Question): Promise<AIExplanation>;
  streamResponse?(context: AIRequestContext, options?: AIStreamOptions): AsyncGenerator<AIStreamChunk, void, void>;
}
