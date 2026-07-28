import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/exam-attempt.repository', () => ({
  examAttemptRepository: {
    loadAttemptWithRelations: vi.fn(),
  },
}))

vi.mock('@/server/repositories/progress.repository', () => ({
  progressRepository: {
    findLessonProgressByUser: vi.fn(),
    upsertLessonProgress: vi.fn(),
    findProgressRowsByUser: vi.fn(),
    countQuizAttempts: vi.fn(),
  },
}))

vi.mock('@/server/services/adaptive-learning.service', () => ({
  getAdaptiveLearningData: vi.fn(),
}))

vi.mock('@/server/services/exam-attempt.service', () => ({
  calculateExamAnalytics: vi.fn(),
}))

vi.mock('@/server/services/progress.service', () => ({
  getStudentProgress: vi.fn(),
  getQuizAttemptCount: vi.fn(),
}))

vi.mock('@/server/services/cache', () => ({
  invalidateServiceCache: vi.fn(),
}))

import { examAttemptRepository } from '@/server/repositories/exam-attempt.repository'
import { progressRepository } from '@/server/repositories/progress.repository'
import { getAdaptiveLearningData } from '@/server/services/adaptive-learning.service'
import { calculateExamAnalytics } from '@/server/services/exam-attempt.service'
import { getStudentProgress, getQuizAttemptCount } from '@/server/services/progress.service'
import { invalidateServiceCache } from '@/server/services/cache'
import { processCompletedAttempt } from '../../server/services/exam-completion.service'

const mockedExamAttemptRepository = vi.mocked(examAttemptRepository, true)
const mockedProgressRepository = vi.mocked(progressRepository, true)
const mockedGetAdaptiveLearningData = vi.mocked(getAdaptiveLearningData)
const mockedCalculateExamAnalytics = vi.mocked(calculateExamAnalytics)
const mockedGetStudentProgress = vi.mocked(getStudentProgress)
const mockedGetQuizAttemptCount = vi.mocked(getQuizAttemptCount)
const mockedInvalidateServiceCache = vi.mocked(invalidateServiceCache)

function createProgressRepository(overrides: Partial<Record<string, any>> = {}) {
  const repo: any = {
    findLessonProgressByUser: vi.fn().mockResolvedValue([]),
    upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
    findProgressRowsByUser: vi.fn().mockResolvedValue([]),
    countQuizAttempts: vi.fn().mockResolvedValue(0),
    ...overrides,
  }

  mockedProgressRepository.findLessonProgressByUser.mockImplementation(repo.findLessonProgressByUser)
  mockedProgressRepository.upsertLessonProgress.mockImplementation(repo.upsertLessonProgress)
  mockedProgressRepository.findProgressRowsByUser.mockImplementation(repo.findProgressRowsByUser)
  mockedProgressRepository.countQuizAttempts.mockImplementation(repo.countQuizAttempts)

  return repo
}

function createAdaptiveService(result: any = null) {
  mockedGetAdaptiveLearningData.mockResolvedValue(result)
  return { getAdaptiveLearningData: mockedGetAdaptiveLearningData }
}

function createAttemptRepository(result: any) {
  mockedExamAttemptRepository.loadAttemptWithRelations.mockResolvedValue(result)
  return mockedExamAttemptRepository
}

function createExamAttemptService(analytics: any) {
  mockedCalculateExamAnalytics.mockResolvedValue(analytics)
  return mockedCalculateExamAnalytics
}

function createProgressService(progressRows: any = [], quizAttempts: number = 0) {
  mockedGetStudentProgress.mockResolvedValue(progressRows)
  mockedGetQuizAttemptCount.mockResolvedValue(quizAttempts)
  return { getStudentProgress: mockedGetStudentProgress, getQuizAttemptCount: mockedGetQuizAttemptCount }
}

describe('exam-completion.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates analytics for a completed attempt', async () => {
    const expectedAnalytics = {
      attemptId: 'attempt-1',
      examTitle: 'Math Mock',
      score: 7,
      percentage: 70,
      passed: true,
      passingScore: 60,
      correctCount: 7,
      incorrectCount: 3,
      unansweredCount: 0,
      timeTakenSeconds: 420,
      topicAnalytics: {
        perTopic: [{ title: 'Fractions', correct: 3, incorrect: 1, unanswered: 0, accuracy: 75 }],
        perModule: [{ title: 'Algebra', correct: 4, incorrect: 2, unanswered: 0, accuracy: 67 }],
        strongTopics: ['Fractions'],
        weakTopics: ['Decimals'],
        mostMissedConcepts: [{ concept: 'Decimal addition', misses: 2 }],
      },
      difficultyAnalytics: {
        easy: { label: 'BEGINNER', attempted: 2, correct: 2, incorrect: 0, unanswered: 0, accuracy: 100 },
        medium: { label: 'INTERMEDIATE', attempted: 5, correct: 4, incorrect: 1, unanswered: 0, accuracy: 80 },
        hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 },
      },
      timeAnalytics: {
        averageSecondsPerQuestion: 42,
        fastestQuestions: [{ questionId: 'q1', seconds: 18 }],
        slowestQuestions: [{ questionId: 'q3', seconds: 60 }],
        distribution: [{ bucket: '0-30s', count: 2 }],
      },
      recommendations: ['Review decimals'],
    }

    const mockAttemptRepo = createAttemptRepository({ id: 'attempt-1', studentId: 'student-1' })
    const mockProgress = createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', userId: 'student-1', lesson: { id: 'l1', title: 'Decimals review' }, percentComplete: 10 }]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ completionPercent: 80 }]),
      countQuizAttempts: vi.fn().mockResolvedValue(2),
    })
    createExamAttemptService(expectedAnalytics)
    createAdaptiveService({ performanceSummary: { recentAccuracy: 80, weakTopics: ['Decimals'], improvedTopics: [] } })
    createProgressService([], 2)

    const result = await processCompletedAttempt('attempt-1')

    expect(result.analytics.attemptId).toBe('attempt-1')
    expect(result.analytics.score).toBe(7)
    expect(result.analytics.percentage).toBe(70)
    expect(result.analytics.topicAnalytics.perTopic.length).toBeGreaterThan(0)
    expect(result.analytics.difficultyAnalytics.easy.label).toBe('BEGINNER')
    expect(result.analytics.timeAnalytics.averageSecondsPerQuestion).toBe(42)
    expect(mockProgress.upsertLessonProgress).toHaveBeenCalled()
    expect(mockAttemptRepo.loadAttemptWithRelations).toHaveBeenCalledWith('attempt-1')
  })

  it('calculates readiness with expected confidence and recommendations', async () => {
    const expectedAnalytics = {
      attemptId: 'attempt-2',
      examTitle: 'Physics Mock',
      score: 8,
      percentage: 80,
      passed: true,
      passingScore: 60,
      correctCount: 8,
      incorrectCount: 2,
      unansweredCount: 0,
      timeTakenSeconds: 300,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: [], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 30, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: ['Keep practicing'],
    }

    createAttemptRepository({ id: 'attempt-2', studentId: 'student-2' })
    createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ completionPercent: 90 }, { completionPercent: 95 }]),
      countQuizAttempts: vi.fn().mockResolvedValue(4),
    })
    createExamAttemptService(expectedAnalytics)
    createAdaptiveService({ performanceSummary: { recentAccuracy: 95, weakTopics: [], improvedTopics: [] } })
    createProgressService([], 4)

    const result = await processCompletedAttempt('attempt-2')

    expect(result.analytics.readiness.readinessPercentage).toBeGreaterThanOrEqual(60)
    expect(result.analytics.readiness.confidence).toBe('Moderate')
    expect(result.analytics.readiness.nextActions).toContain('Review missed topics in your adaptive learning page')
  })

  it('orchestrates adaptive update and progress repository updates once', async () => {
    createAttemptRepository({ id: 'attempt-3', studentId: 'student-3' })
    const mockProgress = createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', userId: 'student-3', lesson: { id: 'l1', title: 'WeakTopic lesson' }, percentComplete: 10 }]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ completionPercent: 50 }]),
      countQuizAttempts: vi.fn().mockResolvedValue(1),
    })
    const mockAdaptive = createAdaptiveService({ performanceSummary: { recentAccuracy: 60, weakTopics: ['WeakTopic'], improvedTopics: [] } })
    createExamAttemptService({
      attemptId: 'attempt-3',
      examTitle: 'Biology Mock',
      score: 6,
      percentage: 60,
      passed: false,
      passingScore: 60,
      correctCount: 6,
      incorrectCount: 4,
      unansweredCount: 0,
      timeTakenSeconds: 360,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: ['WeakTopic'], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 45, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createProgressService([], 1)

    const result = await processCompletedAttempt('attempt-3')

    expect(mockAdaptive.getAdaptiveLearningData).toHaveBeenCalledTimes(1)
    expect(mockProgress.findLessonProgressByUser).toHaveBeenCalledTimes(1)
    expect(mockProgress.upsertLessonProgress).toHaveBeenCalled()
    expect(result.updatedReviewQueue[0].lessonId).toBe('l1')
  })

  it('adds incorrect lesson progress to revision queue only', async () => {
    createAttemptRepository({ id: 'attempt-4', studentId: 'student-4' })
    const mockProgress = createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', userId: 'student-4', lesson: { id: 'l1', title: 'WeakTopic lesson' }, percentComplete: 20 },
        { id: 'lp2', userId: 'student-4', lesson: { id: 'l2', title: 'StrongTopic lesson' }, percentComplete: 90 },
      ]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([]),
      countQuizAttempts: vi.fn().mockResolvedValue(0),
    })
    createExamAttemptService({
      attemptId: 'attempt-4',
      examTitle: 'Chemistry Mock',
      score: 4,
      percentage: 40,
      passed: false,
      passingScore: 60,
      correctCount: 4,
      incorrectCount: 6,
      unansweredCount: 0,
      timeTakenSeconds: 420,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: ['StrongTopic'], weakTopics: ['WeakTopic'], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 42, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createAdaptiveService({ performanceSummary: { recentAccuracy: 55, weakTopics: ['WeakTopic'], improvedTopics: [] } })
    createProgressService([], 0)

    const result = await processCompletedAttempt('attempt-4')

    expect(result.updatedReviewQueue).toHaveLength(1)
    expect(result.updatedReviewQueue[0].lessonId).toBe('l1')
    expect(mockProgress.upsertLessonProgress).toHaveBeenCalledTimes(1)
  })

  it('runs spaced repetition update after completion', async () => {
    createAttemptRepository({ id: 'attempt-5', studentId: 'student-5' })
    const mockProgress = createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([
        { id: 'lp1', userId: 'student-5', lesson: { id: 'l1', title: 'WeakTopic lesson' }, percentComplete: 15 },
      ]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([]),
      countQuizAttempts: vi.fn().mockResolvedValue(0),
    })
    createExamAttemptService({
      attemptId: 'attempt-5',
      examTitle: 'History Mock',
      score: 3,
      percentage: 30,
      passed: false,
      passingScore: 60,
      correctCount: 3,
      incorrectCount: 7,
      unansweredCount: 0,
      timeTakenSeconds: 500,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: ['WeakTopic'], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 50, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createAdaptiveService({ performanceSummary: { recentAccuracy: 40, weakTopics: ['WeakTopic'], improvedTopics: [] } })
    createProgressService([], 0)

    const result = await processCompletedAttempt('attempt-5')

    expect(result.updatedSpacedRepetition).toHaveLength(1)
    expect(mockProgress.upsertLessonProgress).toHaveBeenCalledTimes(1)
  })

  it('propagates repository failures correctly', async () => {
    createAttemptRepository({ id: 'attempt-6', studentId: 'student-6' })
    createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([]),
      countQuizAttempts: vi.fn().mockResolvedValue(0),
    })
    createExamAttemptService({
      attemptId: 'attempt-6',
      examTitle: 'English Mock',
      score: 4,
      percentage: 40,
      passed: false,
      passingScore: 60,
      correctCount: 4,
      incorrectCount: 6,
      unansweredCount: 0,
      timeTakenSeconds: 420,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: [], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 40, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createAdaptiveService({ performanceSummary: { recentAccuracy: 50, weakTopics: [], improvedTopics: [] } })
    createProgressService([], 0)

    mockedExamAttemptRepository.loadAttemptWithRelations.mockRejectedValue(new Error('DB failure'))

    await expect(processCompletedAttempt('attempt-6')).rejects.toThrow('DB failure')
  })

  it('handles missing adaptive data without crashing', async () => {
    createAttemptRepository({ id: 'attempt-7', studentId: 'student-7' })
    createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ completionPercent: 100 }]),
      countQuizAttempts: vi.fn().mockResolvedValue(1),
    })
    createExamAttemptService({
      attemptId: 'attempt-7',
      examTitle: 'Geography Mock',
      score: 5,
      percentage: 50,
      passed: false,
      passingScore: 60,
      correctCount: 5,
      incorrectCount: 5,
      unansweredCount: 0,
      timeTakenSeconds: 420,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: [], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 35, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createAdaptiveService(null)
    createProgressService([], 1)

    const result = await processCompletedAttempt('attempt-7')

    expect(result.analytics).toBeDefined()
    expect(result.analytics.readiness.readinessPercentage).toBeGreaterThanOrEqual(0)
    expect(result.analytics.readiness.confidence).toBeDefined()
  })

  it('returns consistent results and avoids duplicate updates across repeated calls', async () => {
    createAttemptRepository({ id: 'attempt-8', studentId: 'student-8' })
    const mockProgress = createProgressRepository({
      findLessonProgressByUser: vi.fn().mockResolvedValue([{ id: 'lp1', userId: 'student-8', lesson: { id: 'l1', title: 'WeakTopic lesson' }, percentComplete: 25 }]),
      upsertLessonProgress: vi.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      findProgressRowsByUser: vi.fn().mockResolvedValue([{ completionPercent: 70 }]),
      countQuizAttempts: vi.fn().mockResolvedValue(1),
    })
    const mockAdaptive = createAdaptiveService({ performanceSummary: { recentAccuracy: 65, weakTopics: ['WeakTopic'], improvedTopics: [] } })
    createExamAttemptService({
      attemptId: 'attempt-8',
      examTitle: 'Statistics Mock',
      score: 6,
      percentage: 60,
      passed: false,
      passingScore: 60,
      correctCount: 6,
      incorrectCount: 4,
      unansweredCount: 0,
      timeTakenSeconds: 390,
      topicAnalytics: { perTopic: [], perModule: [], strongTopics: [], weakTopics: ['WeakTopic'], mostMissedConcepts: [] },
      difficultyAnalytics: { easy: { label: 'BEGINNER', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, medium: { label: 'INTERMEDIATE', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 }, hard: { label: 'ADVANCED', attempted: 0, correct: 0, incorrect: 0, unanswered: 0, accuracy: 0 } },
      timeAnalytics: { averageSecondsPerQuestion: 39, fastestQuestions: [], slowestQuestions: [], distribution: [] },
      recommendations: [],
    })
    createProgressService([], 1)

    const first = await processCompletedAttempt('attempt-8')
    const second = await processCompletedAttempt('attempt-8')

    expect(first.updatedReviewQueue).toEqual(second.updatedReviewQueue)
    expect(first.updatedSpacedRepetition).toEqual(second.updatedSpacedRepetition)
    expect(mockProgress.upsertLessonProgress).toHaveBeenCalledTimes(1)
    expect(mockAdaptive.getAdaptiveLearningData).toHaveBeenCalledTimes(1)
    expect(first.updatedReviewQueue).toHaveLength(1)
    expect(first.updatedSpacedRepetition).toHaveLength(1)
  })
})
