import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { examTemplateRepository } from '@/server/repositories/exam-template.repository'
import { moduleRepository } from '@/server/repositories/module.repository'
import { questionRepository } from '@/server/repositories/question.repository'
import type { Question } from '@prisma/client'
import type { ExamAnalyticsDTO, TopicAnalyticsDTO, DifficultyAnalyticsDTO, TimeAnalyticsDTO, ExamHistoryDTO } from '@/server/application/dto/exam-analytics.dto'
import { invalidateServiceCache } from '@/server/services/cache'
import type { ExamAttemptDTO, ExamAttemptResultDTO } from '@/server/application/dto/exam-attempt.dto'
import { NotFoundError } from '@/auth'
import { instrumentService } from '@/lib/logger'

type ExamAttemptQuestionRow = {
  id: string
  questionId: string
  displayOrder?: number | null
}

type ExamAttemptAnswerRow = {
  id: string
  attemptQuestionId: string
  selectedOption?: number | null
  bookmarked?: boolean | null
  markedForReview?: boolean | null
  answeredAt?: Date | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

type ExamAttemptEntity = {
  id: string
  studentId: string
  templateId: string
  title?: string | null
  status: string
  startedAt?: Date | null
  submittedAt?: Date | null
  expiresAt?: Date | null
  score?: number | null
  percentage?: number | null
  passed?: boolean | null
  passingPercentage?: number | null
  createdAt?: Date | string
  updatedAt?: Date | string
}

type ExamAttemptAnswerUpdateData = Partial<{ selectedOption: number | null; answeredAt: Date | null }>

function mapQuestionType(questionType: string | null | undefined): import('@/types/exam').QuestionType | undefined {
  if (!questionType) return undefined
  if (questionType.toLowerCase().includes('true')) return 'true-false'
  if (questionType.toLowerCase().includes('multiple')) return 'multiple-choice'
  return 'mcq'
}

function getQuestionOptions(question: Question | null | undefined) {
  if (Array.isArray(question?.options)) return question.options
  if (typeof question?.options === 'string') {
    try {
      const parsed = JSON.parse(question.options)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function findAnswerState(attemptQuestionId: string, answers: ExamAttemptAnswerRow[]) {
  return answers.find((answer) => answer.attemptQuestionId === attemptQuestionId)
}

async function mapAttemptToDTO(entity: ExamAttemptEntity, questions: ExamAttemptQuestionRow[] = [], answers: ExamAttemptAnswerRow[] = []): Promise<ExamAttemptDTO> {
  const questionIds = questions.map((q) => q.questionId).filter(Boolean)
  const questionRows = await questionRepository.findManyByIds(questionIds)
  const questionById = new Map(questionRows.map((question) => [question.id, question]))

  const mappedQuestions = questions.map((attemptQuestion) => {
    const source = questionById.get(attemptQuestion.questionId)
    const answer = findAnswerState(attemptQuestion.id, answers)
    const metadata = typeof source?.metadata === 'object' && source?.metadata !== null ? (source.metadata as Record<string, unknown>) : {}
    const topic = typeof metadata.topic === 'string'
      ? metadata.topic
      : (typeof ((source as unknown as Record<string, unknown>)?.topic) === 'string' ? (source as unknown as Record<string, unknown>).topic as string : undefined)

    return {
      id: attemptQuestion.id,
      questionId: attemptQuestion.questionId,
      question: source?.prompt ?? '',
      options: getQuestionOptions(source),
      selectedOption: typeof answer?.selectedOption === 'number' ? answer.selectedOption : null,
      bookmarked: !!answer?.bookmarked,
      markedForReview: !!answer?.markedForReview,
      displayOrder: typeof attemptQuestion.displayOrder === 'number' ? attemptQuestion.displayOrder : undefined,
      answeredAt: answer?.answeredAt?.toISOString?.() ?? null,
      topic: topic,
      difficulty: source?.difficulty,
      type: mapQuestionType(source?.questionType),
      correctOption: typeof source?.correctOptionIndex === 'number' ? source.correctOptionIndex : undefined,
      explanation: typeof source?.explanation === 'string' ? source.explanation : undefined,
    }
  })

  return {
    id: entity.id,
    studentId: entity.studentId,
    templateId: entity.templateId,
    title: entity.title ?? entity.templateId,
    status: entity.status,
    startedAt: entity.startedAt?.toISOString?.() ?? null,
    submittedAt: entity.submittedAt?.toISOString?.() ?? null,
    expiresAt: entity.expiresAt?.toISOString?.() ?? undefined,
    score: entity.score ?? null,
    percentage: entity.percentage ?? null,
    passed: entity.passed ?? null,
    questions: mappedQuestions,
    createdAt: typeof entity.createdAt === 'string' ? entity.createdAt : entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: typeof entity.updatedAt === 'string' ? entity.updatedAt : entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

function shuffle<T>(arr: T[]) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function generateExamAttempt(templateId: string, studentId: string): Promise<ExamAttemptDTO> {
  return instrumentService('ExamAttemptService', 'generateExamAttempt', async () => {
    const template = await examTemplateRepository.getTemplate(templateId)
    if (!template) throw new NotFoundError('Template not found.')

    // Fetch questions from the referenced question bank when available
    let pool: Question[] = []
    if (template.questionBankId) {
      pool = await questionRepository.findPublishedByBank(template.questionBankId)
    }
    // fallback: if pool empty, use all published questions
    if (!pool || pool.length === 0) {
      const rows = await questionRepository.findAdmin({ status: 'PUBLISHED', take: 1000 })
      pool = rows
    }

    // ensure no duplicates and randomize
    const uniquePool = Array.from(new Map(pool.map((p: Question) => [p.id, p])).values())
    const shuffled = template.shuffleQuestions ? shuffle(uniquePool) : uniquePool
    const selected = shuffled.slice(0, template.questionCount)

    const questionsForInsert = selected.map((q: Question, idx: number) => ({ questionId: q.id, displayOrder: idx + 1 }))

    const now = new Date()
    const expiresAt = new Date(now.getTime() + (template.durationMinutes ?? 60) * 60000)

    const attemptData = {
      studentId,
      templateId,
      status: 'IN_PROGRESS',
      startedAt: now,
      expiresAt,
    }

    const attempt = await examAttemptRepository.createAttemptWithQuestions(attemptData, questionsForInsert)

    // load attempt with relations
    const attemptWithRelations = await examAttemptRepository.loadAttemptWithRelations(attempt.id)
    const savedQuestions = attemptWithRelations?.examAttemptQuestion ?? []
    const savedAnswers = attemptWithRelations?.examAttemptAnswer ?? []

    return mapAttemptToDTO(attempt, savedQuestions, savedAnswers)
  })
}

export async function loadAttempt(attemptId: string): Promise<ExamAttemptDTO | null> {
  return instrumentService('ExamAttemptService', 'loadAttempt', async () => {
    const attempt = await examAttemptRepository.loadAttemptWithRelations(attemptId)
    if (!attempt) return null
    const questions = attempt.examAttemptQuestion ?? []
    const answers = attempt.examAttemptAnswer ?? []
    return mapAttemptToDTO(attempt, questions, answers)
  })
}

export async function loadAttemptByQuestion(attemptQuestionId: string): Promise<ExamAttemptDTO | null> {
  return instrumentService('ExamAttemptService', 'loadAttemptByQuestion', async () => {
    const attemptId = await examAttemptRepository.findAttemptIdByQuestionId(attemptQuestionId)
    if (!attemptId) return null
    return loadAttempt(attemptId)
  })
}

function mapAttemptAnswerToDTO(entity: ExamAttemptAnswerRow) {
  return {
    id: entity.id,
    attemptQuestionId: entity.attemptQuestionId,
    selectedOption: typeof entity.selectedOption === 'number' ? entity.selectedOption : null,
    bookmarked: !!entity.bookmarked,
    markedForReview: !!entity.markedForReview,
    answeredAt: entity.answeredAt?.toISOString?.() ?? null,
    createdAt: entity.createdAt?.toString() ?? new Date().toISOString(),
    updatedAt: entity.updatedAt?.toString() ?? new Date().toISOString(),
  }
}

export async function saveAnswer(attemptQuestionId: string, payload: { selectedOption?: number | null; answeredAt?: Date | null }) {
  return instrumentService('ExamAttemptService', 'saveAnswer', async () => {
    const data: ExamAttemptAnswerUpdateData = {}
    if (typeof payload.selectedOption !== 'undefined') data.selectedOption = payload.selectedOption
    if (payload.answeredAt) data.answeredAt = payload.answeredAt
    const saved = await examAttemptRepository.saveAnswer(attemptQuestionId, data)
    return mapAttemptAnswerToDTO(saved)
  })
}

export async function bookmarkQuestion(attemptQuestionId: string, bookmarked: boolean) {
  return instrumentService('ExamAttemptService', 'bookmarkQuestion', async () => {
    const saved = await examAttemptRepository.bookmarkQuestion(attemptQuestionId, bookmarked)
    return mapAttemptAnswerToDTO(saved)
  })
}

export async function markForReview(attemptQuestionId: string, markedForReview: boolean) {
  return instrumentService('ExamAttemptService', 'markForReview', async () => {
    const saved = await examAttemptRepository.markForReview(attemptQuestionId, markedForReview)
    return mapAttemptAnswerToDTO(saved)
  })
}

export async function submitAttempt(attemptId: string) {
  return instrumentService('ExamAttemptService', 'submitAttempt', async () => {
    const attempt = await examAttemptRepository.loadAttemptWithRelations(attemptId)
    if (!attempt) throw new NotFoundError('Attempt not found.')

    // compute score: simple matching of selectedOption against question.correctOptionIndex
    const answers: ExamAttemptAnswerRow[] = attempt.examAttemptAnswer ?? []
    const questions: ExamAttemptQuestionRow[] = attempt.examAttemptQuestion ?? []

    const questionIds = questions.map((q) => q.questionId).filter(Boolean)
    const questionMap = new Map((await questionRepository.findManyByIds(questionIds)).map((question) => [question.id, question]))

    let total = 0
    let correct = 0
    for (const q of questions) {
      total += 1
      const ans = answers.find((a) => a.attemptQuestionId === q.id)
      if (ans && typeof ans.selectedOption === 'number') {
        const question = questionMap.get(q.questionId)
        if (question && question.correctOptionIndex === ans.selectedOption) correct += 1
      }
    }

    const percentage = total === 0 ? 0 : (correct / total) * 100
    const passed = percentage >= (attempt.passingPercentage ?? 0)

    const updated = await examAttemptRepository.submitAttempt(attemptId, { score: correct, percentage, passed })
    invalidateServiceCache('dashboard-summary')
    invalidateServiceCache('study-planner')
    invalidateServiceCache('progress-insights')
    invalidateServiceCache('achievement-summary')
    invalidateServiceCache('continue-learning')
    invalidateServiceCache('goal-progress')
    return mapAttemptToDTO(updated, questions)
  })
}

type AttemptContext = {
  attempt: ExamAttemptEntity & { examAttemptQuestion?: ExamAttemptQuestionRow[]; examAttemptAnswer?: ExamAttemptAnswerRow[] }
  questions: ExamAttemptQuestionRow[]
  answers: ExamAttemptAnswerRow[]
}

async function getAttemptContext(attemptId: string): Promise<AttemptContext> {
  const attempt = await examAttemptRepository.loadAttemptWithRelations(attemptId)
  if (!attempt) throw new NotFoundError('Attempt not found.')

  return {
    attempt,
    questions: attempt.examAttemptQuestion ?? [],
    answers: attempt.examAttemptAnswer ?? [],
  }
}

export async function calculateExamAnalytics(attemptId: string): Promise<Omit<ExamAnalyticsDTO, 'readiness'>> {
  return instrumentService('ExamAttemptService', 'calculateExamAnalytics', async () => {
    const context = await getAttemptContext(attemptId)
    const template = await examTemplateRepository.getTemplate(context.attempt.templateId)
    const questions = context.questions
    const answers = context.answers

const answeredCount = answers.filter((a) => typeof a.selectedOption === 'number').length
    const totalQuestions = questions.length
    const unansweredCount = Math.max(0, totalQuestions - answeredCount)
    const correctCount = typeof context.attempt.score === 'number' ? Math.round(context.attempt.score) : 0
    const incorrectCount = Math.max(0, answeredCount - correctCount)
    const timeTakenSeconds = context.attempt.startedAt && context.attempt.submittedAt ? Math.max(0, Math.floor((context.attempt.submittedAt.getTime() - context.attempt.startedAt.getTime()) / 1000)) : null

    const topicAnalytics = await calculateTopicAnalyticsFromContext(context)
    const difficultyAnalytics = await calculateDifficultyAnalyticsFromContext(context)
    const timeAnalytics = await calculateTimeAnalyticsFromContext(context)

    return {
      attemptId: context.attempt.id,
      examTitle: template?.name ?? 'Exam Attempt',
      score: correctCount,
      percentage: context.attempt.percentage ?? 0,
      passed: context.attempt.passed ?? false,
      passingScore: template?.passingPercentage ?? 0,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeTakenSeconds,
      topicAnalytics,
      difficultyAnalytics,
      timeAnalytics,
      recommendations: adaptiveRecommendations(),
    }
  })
}

function formatAnswerDuration(answeredAt: Date | null, previousAt: Date | null) {
  if (!answeredAt || !previousAt) return 0
  return Math.max(0, Math.floor((answeredAt.getTime() - previousAt.getTime()) / 1000))
}

async function calculateTopicAnalyticsFromContext(context: AttemptContext): Promise<TopicAnalyticsDTO> {
  const questions = context.questions
  const answers = context.answers

  const topicMap: Record<string, { title: string; correct: number; incorrect: number; unanswered: number }> = {}
  const moduleMap: Record<string, { title: string; correct: number; incorrect: number; unanswered: number }> = {}
  const conceptMisses: Record<string, number> = {}

  const questionIds = questions.map((q) => q.questionId).filter(Boolean)
  const questionsById = new Map((await questionRepository.findManyByIds(questionIds)).map((question) => [question.id, question]))
  const moduleIds = Array.from(new Set(Array.from(questionsById.values()).flatMap((question) => {
    const metadata = (question?.metadata as Record<string, unknown>) ?? {}
    return typeof metadata.moduleId === 'string' ? [metadata.moduleId] : []
  }))) as string[]
  const moduleRecords = moduleIds.length > 0 ? await moduleRepository.findManyByIds(moduleIds) : []
  const moduleRecordMap = new Map(moduleRecords.map((module) => [module.id, module]))

  for (const q of questions) {
    const answer = answers.find((a) => a.attemptQuestionId === q.id)
    const question = questionsById.get(q.questionId)
    const metadata = (question?.metadata as Record<string, unknown>) ?? {}
    const topicTitle = typeof metadata.topic === 'string' ? metadata.topic : `Topic ${q.questionId}`
    const moduleId = typeof metadata.moduleId === 'string' ? metadata.moduleId : 'unknown'
    const moduleRecord = moduleId === 'unknown' ? null : moduleRecordMap.get(moduleId)
    const moduleTitle = moduleRecord?.title ?? `Module ${moduleId}`
    const isAnswered = answer && typeof answer.selectedOption === 'number'
    const isCorrect = isAnswered && question && question.correctOptionIndex === answer.selectedOption

    if (!topicMap[topicTitle]) topicMap[topicTitle] = { title: topicTitle, correct: 0, incorrect: 0, unanswered: 0 }
    if (!moduleMap[moduleTitle]) moduleMap[moduleTitle] = { title: moduleTitle, correct: 0, incorrect: 0, unanswered: 0 }

    if (!isAnswered) {
      topicMap[topicTitle].unanswered += 1
      moduleMap[moduleTitle].unanswered += 1
    } else if (isCorrect) {
      topicMap[topicTitle].correct += 1
      moduleMap[moduleTitle].correct += 1
    } else {
      topicMap[topicTitle].incorrect += 1
      moduleMap[moduleTitle].incorrect += 1
      conceptMisses[question?.prompt ?? q.questionId] = (conceptMisses[question?.prompt ?? q.questionId] ?? 0) + 1
    }
  }

  const perTopic = Object.values(topicMap).map((item) => ({
    ...item,
    accuracy: item.correct + item.incorrect + item.unanswered > 0 ? Math.round((item.correct / (item.correct + item.incorrect + item.unanswered)) * 100) : 0,
  }))

  const perModule = Object.values(moduleMap).map((item) => ({
    ...item,
    accuracy: item.correct + item.incorrect + item.unanswered > 0 ? Math.round((item.correct / (item.correct + item.incorrect + item.unanswered)) * 100) : 0,
  }))

  const sortedTopics = perTopic.slice().sort((a, b) => b.accuracy - a.accuracy)
  const strongTopics = sortedTopics.slice(0, 3).map((item) => item.title)
  const weakTopics = perTopic.slice().sort((a, b) => a.accuracy - b.accuracy).slice(0, 3).map((item) => item.title)
  const mostMissedConcepts = Object.entries(conceptMisses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([concept, misses]) => ({ concept, misses }))

  return { perTopic, perModule, strongTopics, weakTopics, mostMissedConcepts }
}

export async function calculateTopicAnalytics(attemptId: string): Promise<TopicAnalyticsDTO> {
  const context = await getAttemptContext(attemptId)
  return calculateTopicAnalyticsFromContext(context)
}

async function calculateDifficultyAnalyticsFromContext(context: AttemptContext): Promise<DifficultyAnalyticsDTO> {
  const questions = context.questions
  const answers = context.answers

  const buckets: Record<string, { label: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; attempted: number; correct: number; incorrect: number; unanswered: number }> = {
    BEGINNER: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0 },
    INTERMEDIATE: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0 },
    ADVANCED: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0 },
  }

  const questionIds = questions.map((q) => q.questionId).filter(Boolean)
  const questionMap = new Map((await questionRepository.findManyByIds(questionIds)).map((question) => [question.id, question]))

  for (const q of questions) {
    const question = questionMap.get(q.questionId)
    const difficulty = (question?.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') ?? 'BEGINNER'
    const bucket = buckets[difficulty]
    const answer = answers.find((a) => a.attemptQuestionId === q.id)
    const isAnswered = answer && typeof answer.selectedOption === 'number'
    const isCorrect = isAnswered && question && question.correctOptionIndex === answer.selectedOption

    if (!isAnswered) {
      bucket.unanswered += 1
    } else {
      bucket.attempted += 1
      if (isCorrect) bucket.correct += 1
      else bucket.incorrect += 1
    }
  }

  const makeBucket = (bucket: typeof buckets['BEGINNER']) => ({
    ...bucket,
    accuracy: bucket.attempted > 0 ? Math.round((bucket.correct / bucket.attempted) * 100) : 0,
  })

  return {
    easy: makeBucket(buckets.BEGINNER),
    medium: makeBucket(buckets.INTERMEDIATE),
    hard: makeBucket(buckets.ADVANCED),
  }
}

export async function calculateDifficultyAnalytics(attemptId: string): Promise<DifficultyAnalyticsDTO> {
  const context = await getAttemptContext(attemptId)
  return calculateDifficultyAnalyticsFromContext(context)
}

async function calculateTimeAnalyticsFromContext(context: AttemptContext): Promise<TimeAnalyticsDTO> {
  const attempt = context.attempt
  const answers = context.answers

  const normalizedQuestions: Array<{ id: string; questionId: string; displayOrder: number }> = context.questions.map((q, idx) => ({
    id: q.id,
    questionId: q.questionId,
    displayOrder: typeof q.displayOrder === 'number' ? q.displayOrder : idx + 1,
  }))

  const times = normalizedQuestions.map((q, index: number) => {
    const answer = answers.find((a) => a.attemptQuestionId === q.id)
    const previousAnswer = answers[index - 1]
    const seconds = formatAnswerDuration(answer?.answeredAt ?? null, previousAnswer?.answeredAt ?? attempt.startedAt ?? new Date())
    return { id: q.id, prompt: `Question ${q.displayOrder}`, seconds }
  })

  const averageSecondsPerQuestion = times.length > 0 ? Math.round(times.reduce((sum: number, item: { seconds: number }) => sum + item.seconds, 0) / times.length) : 0
  const sorted = times.slice().sort((a: { seconds: number }, b: { seconds: number }) => a.seconds - b.seconds)
  const fastestQuestions = sorted.slice(0, 3)
  const slowestQuestions = sorted.slice(-3).reverse()

  const distributionRanges = [
    { label: '0-30s', min: 0, max: 30 },
    { label: '31-60s', min: 31, max: 60 },
    { label: '61-120s', min: 61, max: 120 },
    { label: '120s+', min: 121, max: Infinity },
  ]

  const distribution = distributionRanges.map((range) => ({
    label: range.label,
    count: times.filter((item: { seconds: number }) => item.seconds >= range.min && item.seconds <= range.max).length,
    range: range.label,
  }))

  return { averageSecondsPerQuestion, fastestQuestions, slowestQuestions, distribution }
}

export async function calculateTimeAnalytics(attemptId: string): Promise<TimeAnalyticsDTO> {
  const context = await getAttemptContext(attemptId)
  return calculateTimeAnalyticsFromContext(context)
}

export async function listExamHistory(studentId: string): Promise<ExamHistoryDTO[]> {
  const rows = await examAttemptRepository.listAttempts(studentId, { take: 10 })

  const history = rows.map((row: { id: string; startedAt?: Date | null; submittedAt?: Date | null; createdAt?: Date | string; score?: number | null; percentage?: number | null; passed?: boolean | null }, index: number) => {
    const durationSeconds = row.startedAt && row.submittedAt ? Math.max(0, Math.floor((row.submittedAt.getTime() - row.startedAt.getTime()) / 1000)) : null
    const currentPct = typeof row.percentage === 'number' ? row.percentage : 0
    const prevPct = typeof rows[index - 1]?.percentage === 'number' ? (rows[index - 1] as any).percentage : 0
    const trend: 'up' | 'down' | 'flat' = index === 0 ? 'flat' : currentPct > prevPct ? 'up' : currentPct < prevPct ? 'down' : 'flat'
    return {
      attemptId: row.id,
      date: row.submittedAt?.toISOString() ?? (typeof row.createdAt === 'string' ? row.createdAt : row.createdAt?.toISOString?.()) ?? new Date().toISOString(),
      score: typeof row.score === 'number' ? Math.round(row.score) : 0,
      percentage: typeof row.percentage === 'number' ? Math.round(row.percentage) : 0,
      passed: !!row.passed,
      durationSeconds,
      trend,
    }
  })

  return history
}

function adaptiveRecommendations(): string[] {
  return [
    'Review weak topics in adaptive learning',
    'Target slow questions with focused practice',
    'Continue spaced repetition for the toughest concepts',
  ]
}

export async function loadAttemptResults(attemptId: string): Promise<ExamAttemptResultDTO | null> {
  const attempt = await examAttemptRepository.loadAttemptWithRelations(attemptId)
  if (!attempt) return null
  const template = await examTemplateRepository.getTemplate(attempt.templateId)
  const questions: ExamAttemptQuestionRow[] = attempt.examAttemptQuestion ?? []
  const answers: ExamAttemptAnswerRow[] = attempt.examAttemptAnswer ?? []

  const answeredCount = answers.filter((a) => typeof a.selectedOption === 'number').length
  const totalQuestions = questions.length
  const unansweredCount = Math.max(0, totalQuestions - answeredCount)
  const correctCount = typeof attempt.score === 'number' ? Math.round(attempt.score) : 0
  const incorrectCount = Math.max(0, answeredCount - correctCount)
  const timeTakenSeconds = attempt.startedAt && attempt.submittedAt ? Math.max(0, Math.floor((attempt.submittedAt.getTime() - attempt.startedAt.getTime()) / 1000)) : null

  const baseAttempt = await mapAttemptToDTO(attempt, questions)

  return {
    ...baseAttempt,
    templateName: template?.name ?? 'Exam Attempt',
    totalQuestions,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds,
  }
}

// helper to get template passing percentage
