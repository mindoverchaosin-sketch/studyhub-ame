import type { QuizAttemptResultDTO, QuizAnalyticsDTO, QuizDTO } from '@/server/application/dto/quiz.dto'
import { quizRepository } from '@/server/repositories/quiz.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { mapQuizEntityToDTO, mapQuizWithQuestionsEntityToDTO } from '@/server/application/mappers/quiz.mapper'
import { invalidateServiceCache } from '@/server/services/cache'
import { upsertLessonProgress } from '@/server/services/progress.service'

export type QuizSubmissionMode = 'practice' | 'mock'

export type QuizSubmissionInput = {
  studentId: string
  quizId: string
  answers: Record<string, string>
  startedAt: number
  mode: QuizSubmissionMode
  durationMinutes: number
  timedOut: boolean
  questionStates?: Record<string, {
    markedForReview?: boolean
    bookmarked?: boolean
    skipped?: boolean
  }>
}

function resolveCorrectAnswer(question: any): string | null {
  if (typeof question.correctAnswer === 'string' && question.correctAnswer.trim().length > 0) {
    return question.correctAnswer
  }

  const options = Array.isArray(question.options) ? question.options : []
  const correctIndex = typeof question.correctOptionIndex === 'number' ? question.correctOptionIndex : null

  if (correctIndex === null || !options[correctIndex]) {
    return null
  }

  if (typeof options[correctIndex] === 'string') {
    return options[correctIndex]
  }

  if (typeof options[correctIndex]?.text === 'string') {
    return options[correctIndex].text
  }

  return null
}

/**
 * QuizService
 * Handles quiz-related database operations
 */

export async function getQuizByTopic(topicId: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findByLesson(topicId)
  return quiz ? mapQuizEntityToDTO(quiz, topicId) : null
}

export async function getQuizById(id: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findById(id)
  return quiz ? mapQuizEntityToDTO(quiz) : null
}

export async function getQuizWithQuestions(id: string): Promise<QuizDTO | null> {
  const quiz = await quizRepository.findWithQuestions(id)
  return quiz ? mapQuizWithQuestionsEntityToDTO(quiz) : null
}

export async function getPublishedQuizzes(): Promise<QuizDTO[]> {
  return (await quizRepository.findAllPublished()).map((q) => mapQuizEntityToDTO(q))
}

export async function getQuizCount(): Promise<number> {
  return quizRepository.countAll()
}

export async function submitQuizAttempt(input: QuizSubmissionInput): Promise<QuizAttemptResultDTO> {
  const quiz = await quizRepository.findWithQuestions(input.quizId)

  if (!quiz) {
    return {
      score: 0,
      correct: 0,
      incorrect: 0,
      passed: false,
      accuracy: 0,
      durationMinutes: input.durationMinutes,
      mode: input.mode,
      timedOut: input.timedOut,
      review: [],
      weakTopics: [],
      analytics: {
        bestScore: 0,
        averageScore: 0,
        completionPercent: 0,
        recentAttempts: [],
      },
    }
  }

  const questions = (quiz.questionBanks ?? []).flatMap((bank: any) => bank.questions.map((question: any) => ({
    id: question.id,
    question: question.prompt,
    correctAnswer: resolveCorrectAnswer(question),
    explanation: question.explanation ?? null,
  })))

  const review = questions.map((question) => {
    const state = input.questionStates?.[question.id] ?? {}
    const selectedAnswer = (input.answers[question.id] ?? '').trim()
    const isCorrect = selectedAnswer.length > 0 && selectedAnswer === question.correctAnswer
    const isSkipped = state.skipped === true || (selectedAnswer.length === 0 && !state.markedForReview)

    return {
      id: question.id,
      question: question.question,
      selectedAnswer: selectedAnswer || null,
      correctAnswer: question.correctAnswer ?? null,
      explanation: question.explanation ?? null,
      isCorrect,
      isSkipped,
      isMarkedForReview: state.markedForReview === true,
      isBookmarked: state.bookmarked === true,
    }
  })

  const correctCount = review.filter((item) => item.isCorrect).length
  const total = review.length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const passed = score >= quiz.passingScore
  const durationMinutes = Math.max(1, Math.ceil((Date.now() - input.startedAt) / 60000))
  const lessonId = quiz.moduleId

  await upsertLessonProgress(input.studentId, lessonId, {
    status: passed ? 'COMPLETED' : 'IN_PROGRESS',
    percentComplete: score,
  })

  await progressRepository.createQuizAttempt({
    userId: input.studentId,
    quizId: input.quizId,
    score,
    passed,
    attemptedAt: new Date(),
  })

  invalidateServiceCache('dashboard-summary', input.studentId)
  invalidateServiceCache('study-planner', input.studentId)
  invalidateServiceCache('progress-insights', input.studentId)
  invalidateServiceCache('achievement-summary', input.studentId)
  invalidateServiceCache('continue-learning', input.studentId)
  invalidateServiceCache('goal-progress', input.studentId)

  const analytics = await getQuizAnalytics(input.studentId, input.quizId)

  return {
    score,
    correct: correctCount,
    incorrect: total - correctCount,
    passed,
    accuracy,
    durationMinutes: input.durationMinutes || durationMinutes,
    mode: input.mode,
    timedOut: input.timedOut,
    review,
    weakTopics: review.filter((item) => !item.isCorrect).slice(0, 3).map((item) => ({
      id: item.id,
      title: item.question,
      reason: 'Needs another pass',
    })),
    analytics,
  }
}

export async function getQuizAnalytics(studentId: string, quizId: string): Promise<QuizAnalyticsDTO> {
  const attempts = await progressRepository.findQuizAttemptsByUser(studentId, quizId)

  const recentAttempts = attempts.slice(0, 3).map((attempt: any) => ({
    id: attempt.id,
    score: attempt.score,
    passed: attempt.passed,
    attemptedAt: attempt.attemptedAt,
    quizTitle: attempt.quiz?.title ?? 'Quiz',
  }))

  const scores = attempts.map((attempt: any) => attempt.score)
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) : 0
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0
  const completionPercent = attempts.length > 0 ? Math.round((attempts.filter((attempt: any) => attempt.passed).length / attempts.length) * 100) : 0

  return {
    bestScore,
    averageScore,
    completionPercent,
    recentAttempts,
  }
}
