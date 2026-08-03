import type { AIContextSnapshot } from '@/types/ai'

export interface AIRetrievalContextOverrides {
  lessonId?: string;
  moduleId?: string;
  questionId?: string;
  query?: string;
}

export interface AIRequestPayload {
  prompt: string;
  conversationId?: string;
  context?: Partial<AIContextSnapshot> & AIRetrievalContextOverrides;
}

export interface AIResponseDTO {
  success: boolean;
  message: string;
  conversationId?: string;
  provider: string;
  timestamp: string;
}

export interface AIExplainResponseDTO {
  success: boolean;
  explanation: {
    answer: string;
    simplified: string;
    relatedConcepts: string[];
    commonMistakes: string[];
    similarQuestions: string[];
  };
  provider: string;
  timestamp: string;
}

export interface AIRecommendationDTO {
  success: boolean;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    reason: string;
    ctaLabel: string;
    href: string;
    priority: string;
  }>;
  timestamp: string;
}
