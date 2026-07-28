export type AiQuestionSuggestionDTO = {
  id: string
  prompt: string
  options: string[]
  explanation: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  tags: string[]
  timeEstimateMinutes: number
  review: {
    duplicate: boolean
    ambiguous: boolean
    grammarIssues: string[]
    missingExplanation: boolean
  }
  requiresApproval: boolean
}

export type AiQuestionGenerationInput = {
  lessonContent: string
  questionBankId: string
}

export type AiQuestionReviewInput = {
  prompt: string
  options: string[]
  explanation?: string
}

export async function generateAiQuestion(input: AiQuestionGenerationInput): Promise<AiQuestionSuggestionDTO> {
  const prompt = input.lessonContent.slice(0, 180)
  return {
    id: `ai-${Date.now()}`,
    prompt: `AI-generated question from: ${prompt}`,
    options: ['Primary option', 'Distractor A', 'Distractor B', 'Distractor C'],
    explanation: 'This explanation is generated from the lesson content and should be reviewed by an editor.',
    difficulty: 'INTERMEDIATE',
    tags: ['ai-generated', 'review-needed'],
    timeEstimateMinutes: 3,
    review: {
      duplicate: false,
      ambiguous: false,
      grammarIssues: [],
      missingExplanation: false,
    },
    requiresApproval: true,
  }
}

export async function reviewAiQuestion(input: AiQuestionReviewInput): Promise<AiQuestionSuggestionDTO> {
  const grammarIssues = input.prompt.includes('?') ? [] : ['Missing question mark']
  return {
    id: `review-${Date.now()}`,
    prompt: input.prompt,
    options: input.options,
    explanation: input.explanation ?? 'A concise explanation is recommended for learner clarity.',
    difficulty: 'BEGINNER',
    tags: ['ai-reviewed'],
    timeEstimateMinutes: 2,
    review: {
      duplicate: false,
      ambiguous: input.prompt.length < 20,
      grammarIssues,
      missingExplanation: !input.explanation,
    },
    requiresApproval: true,
  }
}

export async function bulkAnalyzeAiQuestions(items: AiQuestionReviewInput[]): Promise<AiQuestionSuggestionDTO[]> {
  return Promise.all(items.map((item) => reviewAiQuestion(item)))
}
