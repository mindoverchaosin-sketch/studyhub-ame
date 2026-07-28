import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AnalyticsService } from '@/server/services/analytics.service'
import * as userRepo from '@/server/repositories/user.repository'
import * as moduleRepo from '@/server/repositories/module.repository'
import * as questionRepo from '@/server/repositories/question.repository'
import * as progressRepo from '@/server/repositories/progress.repository'
import * as examAttemptRepo from '@/server/repositories/exam-attempt.repository'
import * as resourceRepo from '@/server/repositories/resource.repository'

const mocks = vi.hoisted(() => ({
  countStudents: vi.fn(),
  countStudentsForAdmin: vi.fn(),
  findAll: vi.fn(),
  countAll: vi.fn(),
  findCompletedCourses: vi.fn(),
  findCompletedTopics: vi.fn(),
  countQuizAttempts: vi.fn(),
}))

vi.mock('@/server/repositories/user.repository', () => ({
  userRepository: {
    countStudents: mocks.countStudents,
    countStudentsForAdmin: mocks.countStudentsForAdmin,
  },
}))

vi.mock('@/server/repositories/module.repository', () => ({
  moduleRepository: {
    findAll: mocks.findAll,
    countAll: mocks.countAll,
  },
}))

vi.mock('@/server/repositories/question.repository', () => ({
  questionRepository: {
    findAll: mocks.findAll,
    countAll: mocks.countAll,
  },
}))

vi.mock('@/server/repositories/progress.repository', () => ({
  progressRepository: {
    findAll: mocks.findAll,
    findCompletedCourses: mocks.findCompletedCourses,
    countQuizAttempts: mocks.countQuizAttempts,
  },
}))

vi.mock('@/server/repositories/exam-attempt.repository', () => ({
  examAttemptRepository: {
    countAll: mocks.countAll,
  },
}))

vi.mock('@/server/repositories/resource.repository', () => ({
  resourceRepository: {
    findAll: mocks.findAll,
    countAll: mocks.countAll,
  },
}))

describe('AnalyticsService', () => {
  let service: AnalyticsService

  beforeEach(() => {
    service = new AnalyticsService()
    vi.clearAllMocks()
  })

  describe('getStudentAnalytics', () => {
    it('should return student metrics', async () => {
      mocks.countStudents.mockResolvedValue(100)
      mocks.countStudentsForAdmin.mockResolvedValue(95)

      const result = await service.getStudentAnalytics()

      expect(result).toMatchObject({
        totalStudents: 100,
        activeStudents: 95,
        newRegistrations: 15, // 15% of 100
        registrationTrend: null,
      })
    })

    it('should handle zero students', async () => {
      mocks.countStudents.mockResolvedValue(0)
      mocks.countStudentsForAdmin.mockResolvedValue(0)

      const result = await service.getStudentAnalytics()

      expect(result.totalStudents).toBe(0)
      expect(result.activeStudents).toBe(0)
    })
  })

  describe('getLearningAnalytics', () => {
    it('should return learning metrics', async () => {
      const completedCourses = [{ id: '1' }, { id: '2' }, { id: '3' }]
      const allProgress = Array(10).fill({ courseId: '1' })

      mocks.findCompletedCourses.mockResolvedValue(completedCourses)
      mocks.findAll.mockResolvedValue(allProgress)

      const result = await service.getLearningAnalytics()

      expect(result).toMatchObject({
        moduleCompletionRate: 30,
        resourceUsageCount: 3,
      })
      expect(result.mostStudiedModules).toBeDefined()
    })

    it('should handle empty progress', async () => {
      mocks.findCompletedCourses.mockResolvedValue([])
      mocks.findAll.mockResolvedValue([])

      const result = await service.getLearningAnalytics()

      expect(result.moduleCompletionRate).toBe(0)
      expect(result.resourceUsageCount).toBe(0)
      expect(result.mostStudiedModules).toEqual([])
    })
  })

  describe('getQuestionBankAnalytics', () => {
    it('should return question metrics with difficulty distribution', async () => {
      const questions = [
        { id: '1', difficulty: 'BEGINNER', prompt: 'Q1', questionBankId: 'bank1', createdAt: new Date() },
        { id: '2', difficulty: 'INTERMEDIATE', prompt: 'Q2', questionBankId: 'bank1', createdAt: new Date() },
        { id: '3', difficulty: 'ADVANCED', prompt: 'Q3', questionBankId: 'bank2', createdAt: new Date() },
      ]

      mocks.countAll.mockResolvedValueOnce(3) // for countAll on questionRepository
      mocks.findAll.mockResolvedValueOnce(questions)

      const result = await service.getQuestionBankAnalytics()

      expect(result).toMatchObject({
        totalQuestions: 3,
        byDifficulty: { BEGINNER: 1, INTERMEDIATE: 1, ADVANCED: 1 },
      })
      expect(result.byModule.length).toBeGreaterThan(0)
      expect(result.recentlyAdded.length).toBeGreaterThan(0)
    })

    it('should handle empty questions', async () => {
      mocks.countAll.mockResolvedValueOnce(0)
      mocks.findAll.mockResolvedValueOnce([])

      const result = await service.getQuestionBankAnalytics()

      expect(result.totalQuestions).toBe(0)
      expect(result.byModule).toEqual([])
      expect(result.recentlyAdded).toEqual([])
    })
  })

  describe('getMockExamAnalytics', () => {
    it('should return exam metrics', async () => {
      mocks.countAll.mockResolvedValueOnce(50) // for countAll on examAttemptRepository

      const result = await service.getMockExamAnalytics()

      expect(result).toMatchObject({
        totalAttempts: 50,
        passRate: 0, // placeholder
        completionRate: 0, // placeholder
        averageScore: null, // placeholder
      })
    })

    it('should handle zero attempts', async () => {
      mocks.countAll.mockResolvedValueOnce(0)

      const result = await service.getMockExamAnalytics()

      expect(result.totalAttempts).toBe(0)
    })
  })

  describe('getPublishingAnalytics', () => {
    it('should return publishing metrics by entity type', async () => {
      const modules = [
        { id: '1', status: 'PUBLISHED' },
        { id: '2', status: 'DRAFT' },
      ]
      const resources = [
        { id: '1', status: 'PUBLISHED' },
        { id: '2', status: 'ARCHIVED' },
      ]
      const questions = [
        { id: '1', status: 'PUBLISHED' },
        { id: '2', status: 'DRAFT' },
        { id: '3', status: 'DRAFT' },
      ]

      let callCount = 0
      mocks.findAll.mockImplementation(() => {
        const responses = [modules, resources, questions]
        return Promise.resolve(responses[callCount++])
      })

      const result = await service.getPublishingAnalytics()

      expect(result).toMatchObject({
        draftCount: 3, // 1 module + 2 questions (0 resources)
        publishedCount: 3,
        archivedCount: 1,
      })
      expect(result.byEntityType).toBeDefined()
    })

    it('should handle empty data', async () => {
      mocks.findAll.mockResolvedValue([])

      const result = await service.getPublishingAnalytics()

      expect(result.draftCount).toBe(0)
      expect(result.publishedCount).toBe(0)
      expect(result.archivedCount).toBe(0)
    })
  })

  describe('getDashboard', () => {
    it('should aggregate all analytics into dashboard DTO', async () => {
      // Setup all mocks
      mocks.countStudents.mockResolvedValue(100)
      mocks.countStudentsForAdmin.mockResolvedValue(95)
      mocks.findCompletedCourses.mockResolvedValue(Array(30).fill({ id: '1' }))
      mocks.findAll.mockResolvedValue([])
      mocks.countAll.mockResolvedValue(50)

      const result = await service.getDashboard()

      expect(result).toMatchObject({
        students: { totalStudents: 100, activeStudents: 95 },
        learning: {},
        questionBank: {},
        mockExams: { totalAttempts: 50 },
        publishing: {},
        generatedAt: expect.any(String),
      })
      expect(result.trends).toMatchObject({
        dailyRegistrations: null,
        dailyExamAttempts: null,
        dailyStudySessions: null,
      })
    })
  })
})
