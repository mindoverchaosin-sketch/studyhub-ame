import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getTemplate: vi.fn(),
  createAttemptWithQuestions: vi.fn(),
  loadAttemptWithRelations: vi.fn(),
  findManyByIds: vi.fn(),
  findByBank: vi.fn(),
  findAdmin: vi.fn(),
  listAttempts: vi.fn(),
  findManyByIdsModule: vi.fn(),
  invalidateServiceCache: vi.fn(),
}))

vi.mock('@/server/repositories/exam-template.repository', () => ({
  examTemplateRepository: {
    getTemplate: mocks.getTemplate,
  },
}))

vi.mock('@/server/repositories/exam-attempt.repository', () => ({
  examAttemptRepository: {
    createAttemptWithQuestions: mocks.createAttemptWithQuestions,
    loadAttemptWithRelations: mocks.loadAttemptWithRelations,
    listAttempts: mocks.listAttempts,
  },
}))

vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: {
    findByBank: mocks.findByBank,
    findAdmin: mocks.findAdmin,
    findManyByIds: mocks.findManyByIds,
  },
}))

vi.mock('@/server/repositories/module.repository', () => ({
  moduleRepository: {
    findManyByIds: mocks.findManyByIdsModule,
  },
}))

vi.mock('@/lib/logger', () => ({
  instrumentService: async (_service: string, _name: string, fn: () => unknown) => await fn(),
}))

vi.mock('@/server/services/cache', () => ({
  invalidateServiceCache: mocks.invalidateServiceCache,
}))

import {
  calculateTimeAnalytics,
  calculateTopicAnalytics,
  listExamHistory,
  loadAttempt,
} from '@/server/services/exam-attempt.service'

describe('exam-attempt.service mapping and analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getTemplate.mockResolvedValue({
      id: 'tpl1',
      name: 'Mock Template',
      questionBankId: 'bank1',
      durationMinutes: 30,
      questionCount: 2,
      shuffleQuestions: true,
      passingPercentage: 70,
    })
    mocks.createAttemptWithQuestions.mockResolvedValue({ id: 'attempt1', createdAt: new Date(), updatedAt: new Date() })
  })

  it('maps attempts to DTOs and normalizes metadata, dates, and optional fields', async () => {
    mocks.loadAttemptWithRelations.mockResolvedValue({
      id: 'attempt1',
      studentId: 'student1',
      templateId: 'tpl1',
      title: 'My Attempt',
      status: 'IN_PROGRESS',
      startedAt: new Date('2024-01-02T00:00:00.000Z'),
      submittedAt: new Date('2024-01-02T00:10:00.000Z'),
      expiresAt: new Date('2024-01-02T00:20:00.000Z'),
      score: 1,
      percentage: 50,
      passed: false,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: '2024-01-01T00:05:00.000Z',
      examAttemptQuestion: [
        { id: 'aq1', questionId: 'q1', displayOrder: null },
        { id: 'aq2', questionId: 'q2', displayOrder: 2 },
      ],
      examAttemptAnswer: [
        {
          id: 'ans1',
          attemptQuestionId: 'aq1',
          selectedOption: 1,
          answeredAt: new Date('2024-01-02T00:01:00.000Z'),
        },
      ],
    })

    mocks.findManyByIds.mockResolvedValue([
      {
        id: 'q1',
        prompt: 'What is 2 + 2?',
        options: ['3', '4'],
        metadata: { topic: 'Arithmetic', moduleId: 'mod-1' },
        questionType: 'multiple-choice',
        difficulty: 'BEGINNER',
        correctOptionIndex: 1,
        explanation: null,
        topic: 'Math',
      },
      {
        id: 'q2',
        prompt: 'True or false?',
        options: ['true', 'false'],
        metadata: {},
        questionType: 'true-false',
        difficulty: 'INTERMEDIATE',
        correctOptionIndex: null,
        explanation: null,
        topic: 'Science',
      },
    ])

    const attempt = await loadAttempt('attempt1')

    expect(attempt?.title).toBe('My Attempt')
    expect(attempt?.startedAt).toBe('2024-01-02T00:00:00.000Z')
    expect(attempt?.createdAt).toBe('2024-01-01T00:00:00.000Z')
    expect(attempt?.updatedAt).toBe('2024-01-01T00:05:00.000Z')
    expect(attempt?.questions[0].topic).toBe('Arithmetic')
    expect(attempt?.questions[0].displayOrder).toBeUndefined()
    expect(attempt?.questions[0].correctOption).toBe(1)
    expect(attempt?.questions[1].correctOption).toBeUndefined()
    expect(attempt?.questions[1].explanation).toBeUndefined()
    expect(attempt?.questions[1].topic).toBe('Science')
    expect(attempt?.questions[0].answeredAt).toBe('2024-01-02T00:01:00.000Z')
  })

  it('returns empty arrays and default values when optional fields are missing', async () => {
    mocks.loadAttemptWithRelations.mockResolvedValue({
      id: 'attempt2',
      studentId: 'student2',
      templateId: 'tpl2',
      title: null,
      status: 'IN_PROGRESS',
      startedAt: null,
      submittedAt: null,
      expiresAt: null,
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z',
      examAttemptQuestion: [],
      examAttemptAnswer: [],
    })

    mocks.findManyByIds.mockResolvedValue([])

    const attempt = await loadAttempt('attempt2')

    expect(attempt?.questions).toEqual([])
    expect(attempt?.title).toBe('tpl2')
    expect(attempt?.startedAt).toBeNull()
    expect(attempt?.expiresAt).toBeUndefined()
    expect(attempt?.createdAt).toBe('2024-01-03T00:00:00.000Z')
  })

  it('uses a display-order fallback for time analytics when a question has no explicit order', async () => {
    mocks.loadAttemptWithRelations.mockResolvedValue({
      id: 'attempt3',
      studentId: 'student3',
      templateId: 'tpl3',
      title: 'Order Test',
      status: 'IN_PROGRESS',
      startedAt: new Date('2024-01-04T00:00:00.000Z'),
      submittedAt: new Date('2024-01-04T00:00:30.000Z'),
      examAttemptQuestion: [{ id: 'aq1', questionId: 'q1' }, { id: 'aq2', questionId: 'q2' }],
      examAttemptAnswer: [{ id: 'ans1', attemptQuestionId: 'aq1', selectedOption: 0, answeredAt: new Date('2024-01-04T00:00:10.000Z') }],
    })
    mocks.findManyByIds.mockResolvedValue([
      { id: 'q1', prompt: 'Q1', options: [], metadata: {}, questionType: 'mcq', difficulty: 'BEGINNER', correctOptionIndex: 0, explanation: null },
      { id: 'q2', prompt: 'Q2', options: [], metadata: {}, questionType: 'mcq', difficulty: 'BEGINNER', correctOptionIndex: 0, explanation: null },
    ])

    const analytics = await calculateTimeAnalytics('attempt3')

    expect(analytics.averageSecondsPerQuestion).toBeGreaterThanOrEqual(0)
    expect(analytics.fastestQuestions.some((item) => item.prompt === 'Question 1')).toBe(true)
    expect(analytics.slowestQuestions.some((item) => item.prompt === 'Question 2')).toBe(true)
  })

  it('calculates topic analytics from metadata and answer state', async () => {
    mocks.loadAttemptWithRelations.mockResolvedValue({
      id: 'attempt4',
      studentId: 'student4',
      templateId: 'tpl4',
      title: 'Topic Analytics',
      status: 'SUBMITTED',
      startedAt: new Date('2024-01-05T00:00:00.000Z'),
      submittedAt: new Date('2024-01-05T00:04:00.000Z'),
      examAttemptQuestion: [{ id: 'aq1', questionId: 'q1' }, { id: 'aq2', questionId: 'q2' }],
      examAttemptAnswer: [{ id: 'ans1', attemptQuestionId: 'aq1', selectedOption: 0 }, { id: 'ans2', attemptQuestionId: 'aq2', selectedOption: 1 }],
    })

    mocks.findManyByIds.mockResolvedValue([
      { id: 'q1', prompt: 'Q1', options: [], metadata: { topic: 'Algebra', moduleId: 'mod-1' }, questionType: 'mcq', difficulty: 'BEGINNER', correctOptionIndex: 0, explanation: null },
      { id: 'q2', prompt: 'Q2', options: [], metadata: { topic: 'Geometry', moduleId: 'mod-2' }, questionType: 'mcq', difficulty: 'BEGINNER', correctOptionIndex: 1, explanation: null },
    ])
    mocks.findManyByIdsModule.mockResolvedValue([{ id: 'mod-1', title: 'Algebra Module' }, { id: 'mod-2', title: 'Geometry Module' }])

    const analytics = await calculateTopicAnalytics('attempt4')

    expect(analytics.perTopic.some((item) => item.title === 'Algebra')).toBe(true)
    expect(analytics.perModule.some((item) => item.title === 'Algebra Module')).toBe(true)
    expect(analytics.strongTopics).toContain('Algebra')
    expect(analytics.weakTopics).toContain('Geometry')
  })

  it('calculates history trend and percentage values safely for missing and nullable fields', async () => {
    mocks.listAttempts.mockResolvedValue([
      { id: 'a1', startedAt: new Date('2024-01-01T00:00:00.000Z'), submittedAt: new Date('2024-01-01T00:02:00.000Z'), createdAt: '2024-01-01T00:00:00.000Z', score: 1, percentage: 60, passed: true },
      { id: 'a2', startedAt: new Date('2024-01-02T00:00:00.000Z'), submittedAt: new Date('2024-01-02T00:03:00.000Z'), createdAt: '2024-01-02T00:00:00.000Z', score: 0, percentage: 40, passed: false },
      { id: 'a3', startedAt: null, submittedAt: null, createdAt: null, score: 0, percentage: null, passed: true },
    ])

    const history = await listExamHistory('student5')

    expect(history[0].trend).toBe('flat')
    expect(history[1].trend).toBe('down')
    expect(history[2].percentage).toBe(0)
    expect(history[2].durationSeconds).toBeNull()
    expect(history[2].date).toBeDefined()
  })
})
