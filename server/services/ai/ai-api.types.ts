export interface AIRequestPayload {
  prompt: string;
  conversationId?: string;
  context?: Record<string, unknown>;
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
