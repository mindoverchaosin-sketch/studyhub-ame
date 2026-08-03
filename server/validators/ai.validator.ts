import { z } from 'zod'
import type { AIContextSnapshot } from '@/types/ai'

export const aiContextSchema = z
  .object({
    currentModule: z.string().trim().min(1).max(100).optional(),
    currentLesson: z.string().trim().min(1).max(100).optional(),
    mockPerformance: z.number().min(0).max(100).optional(),
    weakTopics: z.array(z.string().trim().min(1).max(100)).optional(),
    recentQuestions: z.array(z.string().trim().min(1).max(200)).optional(),
    studyStreak: z.number().min(0).max(365).optional(),
    learningGoals: z.array(z.string().trim().min(1).max(200)).optional(),
    currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    examDate: z.string().trim().min(1).optional(),
    lessonId: z.string().trim().min(1).optional(),
    moduleId: z.string().trim().min(1).optional(),
    questionId: z.string().trim().min(1).optional(),
    query: z.string().trim().min(1).max(500).optional(),
  })
  .strict()

export type AIContextOverrides = z.infer<typeof aiContextSchema>

export const aiChatPayloadSchema = z.object({
  prompt: z.string().trim().min(1).max(5000),
  conversationId: z.string().trim().min(1).optional(),
  context: aiContextSchema.optional(),
})

export const aiExplainPayloadSchema = z.object({
  questionId: z.string().trim().min(1),
})

export const aiSummarizePayloadSchema = z.object({
  prompt: z.string().trim().min(1).max(5000),
})

export const aiGenerateQuestionsPayloadSchema = z.object({
  topic: z.string().trim().min(1).max(200),
})
